import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/landing.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("terms", "routes/terms.tsx"),
  route("doctors", "routes/doctors.tsx"),
  route("home", "routes/home.tsx"),
  route("request-doctor", "routes/request-doctor.tsx"),
  route("pending-requests", "routes/pending-requests.tsx"),
  route("doctor-home", "routes/doctor-home.tsx"),
  route("profile", "routes/profile.tsx"),
] satisfies RouteConfig;
