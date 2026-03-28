package com.enterprise.iam_service.service;

import com.google.ortools.Loader;
import com.google.ortools.constraintsolver.Assignment;
import com.google.ortools.constraintsolver.FirstSolutionStrategy;
import com.google.ortools.constraintsolver.LocalSearchMetaheuristic;
import com.google.ortools.constraintsolver.RoutingDimension;
import com.google.ortools.constraintsolver.RoutingIndexManager;
import com.google.ortools.constraintsolver.RoutingModel;
import com.google.ortools.constraintsolver.RoutingSearchParameters;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class OrToolsRouteOptimizerService {

    private static final int INFINITE_TRAVEL_THRESHOLD = Integer.MAX_VALUE / 8;
    private static final long NO_ASSIGNMENT_PENALTY = Long.MAX_VALUE / 8;
    private static final boolean ORTOOLS_AVAILABLE = initOrTools();

    private static boolean initOrTools() {
        try {
            Loader.loadNativeLibraries();
            log.info("OR-Tools native libraries loaded successfully");
            return true;
        } catch (Throwable ex) {
            log.warn("OR-Tools native libraries unavailable ({}: {}). Falling back to greedy optimizer.",
                    ex.getClass().getSimpleName(), ex.getMessage());
            return false;
        }
    }

    public OptimizationResult optimize(
            int[][] travelSeconds,
            LocalTime shiftStart,
            LocalTime shiftEnd,
            int visitDurationMinutes,
            int[] dropPenalties
    ) {
        int nodeCount = travelSeconds.length;
        if (nodeCount <= 1) {
            return new OptimizationResult(List.of(), List.of());
        }

        if (!ORTOOLS_AVAILABLE) {
            return greedyFallback(travelSeconds, shiftStart, shiftEnd, visitDurationMinutes, dropPenalties);
        }

        try {
            return optimizeWithOrTools(travelSeconds, shiftStart, shiftEnd, visitDurationMinutes, dropPenalties);
        } catch (Throwable ex) {
            log.warn("OR-Tools optimization failed at runtime. Falling back to greedy optimizer.", ex);
            return greedyFallback(travelSeconds, shiftStart, shiftEnd, visitDurationMinutes, dropPenalties);
        }
    }

    private OptimizationResult optimizeWithOrTools(
            int[][] travelSeconds,
            LocalTime shiftStart,
            LocalTime shiftEnd,
            int visitDurationMinutes,
            int[] dropPenalties
    ) {
        int nodeCount = travelSeconds.length;

        RoutingIndexManager manager = new RoutingIndexManager(nodeCount, 1, 0);
        RoutingModel routing = new RoutingModel(manager);

        int serviceSeconds = visitDurationMinutes * 60;

        int transitCallbackIndex = routing.registerTransitCallback((fromIndex, toIndex) -> {
            int fromNode = manager.indexToNode(fromIndex);
            int toNode = manager.indexToNode(toIndex);
            int travel = travelSeconds[fromNode][toNode];
            int service = fromNode == 0 ? 0 : serviceSeconds;
            if (travel >= INFINITE_TRAVEL_THRESHOLD) {
                return NO_ASSIGNMENT_PENALTY;
            }
            return (long) travel + service;
        });

        routing.setArcCostEvaluatorOfAllVehicles(transitCallbackIndex);

        long horizonSeconds = Math.max(1, shiftEnd.toSecondOfDay() - shiftStart.toSecondOfDay());
        routing.addDimension(transitCallbackIndex, 0, horizonSeconds, true, "Time");
        RoutingDimension timeDimension = routing.getMutableDimension("Time");

        long start = shiftStart.toSecondOfDay();
        long end = shiftEnd.toSecondOfDay();

        // Depot starts at zero in solver-time. We offset to wall-clock later.
        timeDimension.cumulVar(routing.start(0)).setRange(0, 0);

        for (int node = 1; node < nodeCount; node++) {
            long index = manager.nodeToIndex(node);
            timeDimension.cumulVar(index).setRange(0, end - start);
            int penalty = dropPenalties[node - 1];
            routing.addDisjunction(new long[]{index}, penalty);
        }

        RoutingSearchParameters searchParameters = com.google.ortools.constraintsolver.main.defaultRoutingSearchParameters()
                .toBuilder()
                .setFirstSolutionStrategy(FirstSolutionStrategy.Value.PATH_CHEAPEST_ARC)
                .setLocalSearchMetaheuristic(LocalSearchMetaheuristic.Value.GUIDED_LOCAL_SEARCH)
                .setTimeLimit(com.google.protobuf.Duration.newBuilder().setSeconds(8).build())
                .build();

        Assignment solution = routing.solveWithParameters(searchParameters);
        if (solution == null) {
            log.warn("OR-Tools returned no solution");
            return new OptimizationResult(List.of(), List.of());
        }

        List<Integer> orderedNodes = new ArrayList<>();
        List<LocalTime> arrivals = new ArrayList<>();

        long index = routing.start(0);
        while (!routing.isEnd(index)) {
            long nextIndex = solution.value(routing.nextVar(index));
            if (routing.isEnd(nextIndex)) {
                break;
            }
            int node = manager.indexToNode(nextIndex);
            long arrivalFromShiftStart = solution.value(timeDimension.cumulVar(nextIndex));
            orderedNodes.add(node);
            arrivals.add(shiftStart.plusSeconds(arrivalFromShiftStart));
            index = nextIndex;
        }

        return new OptimizationResult(orderedNodes, arrivals);
    }

    private OptimizationResult greedyFallback(
            int[][] travelSeconds,
            LocalTime shiftStart,
            LocalTime shiftEnd,
            int visitDurationMinutes,
            int[] dropPenalties
    ) {
        int nodeCount = travelSeconds.length;
        int serviceSeconds = Math.max(0, visitDurationMinutes) * 60;
        long shiftBudget = Math.max(0, shiftEnd.toSecondOfDay() - shiftStart.toSecondOfDay());

        boolean[] visited = new boolean[nodeCount];
        int currentNode = 0;
        long elapsed = 0;

        List<Integer> orderedNodes = new ArrayList<>();
        List<LocalTime> arrivals = new ArrayList<>();

        while (true) {
            int bestNode = -1;
            int bestCost = Integer.MAX_VALUE;

            for (int node = 1; node < nodeCount; node++) {
                if (visited[node]) {
                    continue;
                }

                int travel = travelSeconds[currentNode][node];
                if (travel >= INFINITE_TRAVEL_THRESHOLD) {
                    continue;
                }

                if (travel < bestCost) {
                    bestCost = travel;
                    bestNode = node;
                }
            }

            if (bestNode == -1) {
                break;
            }

            long arrivalOffset = elapsed + bestCost;
            long departureOffset = arrivalOffset + serviceSeconds;

            if (arrivalOffset > shiftBudget || departureOffset > shiftBudget) {
                break;
            }

            orderedNodes.add(bestNode);
            arrivals.add(shiftStart.plusSeconds(arrivalOffset));
            visited[bestNode] = true;
            currentNode = bestNode;
            elapsed = departureOffset;
        }

        return new OptimizationResult(orderedNodes, arrivals);
    }

    public record OptimizationResult(List<Integer> orderedNodes, List<LocalTime> arrivals) {}
}
