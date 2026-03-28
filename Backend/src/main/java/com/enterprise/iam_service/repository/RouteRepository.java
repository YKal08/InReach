package com.enterprise.iam_service.repository;
 
import com.enterprise.iam_service.model.Route;
import com.enterprise.iam_service.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
 
@Repository
public interface RouteRepository extends JpaRepository<Route, UUID> {
 
    // * Used at shift start to prevent duplicate routes on the same day.
    Optional<Route> findByDoctorAndDate(User doctor, LocalDate date);
 
    // * Used by the WebSocket location controller to find today's active route.
    Optional<Route> findByDoctorEgnAndDate(String doctorEgn, LocalDate date);

    List<Route> findByDoctorAndDateOrderByCreatedAtDesc(User doctor, LocalDate date);

    List<Route> findByDoctorOrderByDateDescCreatedAtDesc(User doctor);

    List<Route> findByDateOrderByCreatedAtDesc(LocalDate date);
}