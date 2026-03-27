package com.enterprise.iam_service.repository;
 
import com.enterprise.iam_service.model.DriverSchedule;
import com.enterprise.iam_service.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.util.List;
import java.util.Optional;
import java.util.UUID;
 
@Repository
public interface DriverScheduleRepository extends JpaRepository<DriverSchedule, UUID> {
 
    // * Used when assigning deliveries to find available pharmacists by zone.
    Optional<DriverSchedule> findByPharmacistAndDayOfWeek(User pharmacist, Integer dayOfWeek);
 
    // * Returns all pharmacists covering a specific delivery zone today.
    List<DriverSchedule> findByDeliveryZone(String deliveryZone);
    
    List<DriverSchedule> findByPharmacist(User pharmacist);
}