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

    static {
        Loader.loadNativeLibraries();
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

        RoutingIndexManager manager = new RoutingIndexManager(nodeCount, 1, 0);
        RoutingModel routing = new RoutingModel(manager);

        int serviceSeconds = visitDurationMinutes * 60;

        int transitCallbackIndex = routing.registerTransitCallback((fromIndex, toIndex) -> {
            int fromNode = manager.indexToNode(fromIndex);
            int toNode = manager.indexToNode(toIndex);
            int travel = travelSeconds[fromNode][toNode];
            int service = fromNode == 0 ? 0 : serviceSeconds;
            if (travel >= Integer.MAX_VALUE / 8) {
                return Integer.MAX_VALUE / 16;
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

    public record OptimizationResult(List<Integer> orderedNodes, List<LocalTime> arrivals) {}
}
