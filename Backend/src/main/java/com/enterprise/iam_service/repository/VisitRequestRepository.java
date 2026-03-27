package com.enterprise.iam_service.repository;
 
import com.enterprise.iam_service.model.User;
import com.enterprise.iam_service.model.VisitRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.util.List;
import java.util.Optional;
import java.util.UUID;
 
@Repository
public interface VisitRequestRepository extends JpaRepository<VisitRequest, UUID> {
 
    // * All unassigned requests waiting to be put on a route.
    List<VisitRequest> findByStatus(String status);
 
    // * A specific patient's full request history.
    List<VisitRequest> findByUser(User user);

    // * Same as above, but sorted newest first for UI display.
    List<VisitRequest> findByUserOrderByCreatedAtDesc(User user);

    // * Fetches one request only if it belongs to the given user.
    Optional<VisitRequest> findByIdAndUser(UUID id, User user);
 
    // * All requests currently targeting a doctor by EGN.
    List<VisitRequest> findByDoctorEgnAndStatus(String doctorEgn, String status);

    // * Oldest-first order for planning priority.
    List<VisitRequest> findByDoctorEgnAndStatusOrderByCreatedAtAsc(String doctorEgn, String status);
}