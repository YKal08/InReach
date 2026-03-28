package com.enterprise.iam_service.repository;
 
import com.enterprise.iam_service.model.DoctorSchedule;
import com.enterprise.iam_service.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
 
@Repository
public interface DoctorScheduleRepository extends JpaRepository<DoctorSchedule, UUID> {
 
    // * Core working-hours check — called at shift start to validate current time.
    Optional<DoctorSchedule> findByDoctorAndDayOfWeek(User doctor, Integer dayOfWeek);
 
    // * Returns the full weekly schedule for a doctor (for admin/profile view).
    List<DoctorSchedule> findByDoctor(User doctor);

    Optional<DoctorSchedule> findByDoctorAndSpecificDateAndActiveTrue(User doctor, LocalDate specificDate);

    Optional<DoctorSchedule> findByDoctorAndDayOfWeekAndSpecificDateIsNullAndActiveTrue(User doctor, Integer dayOfWeek);
}