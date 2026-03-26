package com.enterprise.iam_service.repository;
 
import com.enterprise.iam_service.model.Route;
import com.enterprise.iam_service.model.RouteStop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.util.List;
 
@Repository
public interface RouteStopRepository extends JpaRepository<RouteStop, Long> {
 
    // * Returns stops in visit order (1, 2, 3…) for the doctor's route view.
    List<RouteStop> findByRouteOrderByStopOrderAsc(Route route);
 
    // * Used to check if all stops are done before marking route COMPLETED.
    List<RouteStop> findByRouteAndStatus(Route route, String status);
}