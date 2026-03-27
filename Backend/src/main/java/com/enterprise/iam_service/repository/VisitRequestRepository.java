package com.enterprise.iam_service.repository;
 
import com.enterprise.iam_service.model.User;
import com.enterprise.iam_service.model.VisitRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.util.List;
import java.util.UUID;
 
@Repository
public interface VisitRequestRepository extends JpaRepository<VisitRequest, UUID> {
 
    // * All unassigned requests waiting to be put on a route.
    List<VisitRequest> findByStatus(String status);
 
    // * A specific patient's full request history.
    List<VisitRequest> findByUser(User user);
 
    // * All requests currently assigned to a doctor (for dispatch checks).
    List<VisitRequest> findByAssignedDoctorAndStatus(User doctor, String status);
}