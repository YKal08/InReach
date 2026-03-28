import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { api, request } from "../utils/api";
import { useRoleGuard } from "../utils/useRoleGuard";
import { useAuth } from "../components/AuthContext";
import { extractRoleNames, type RoleLike } from "../utils/roles";

interface AdminRole {
  id: number;
  name: string;
  description: string;
}

interface AdminUser {
  egn: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  status?: string;
  roles?: RoleLike[];
}

interface RoleUpdateResponse {
  message: string;
  userId: string;
  roles: string[];
}

const DEFAULT_ROLE = "";

export default function AdminRoute() {
  const { isLoading: authLoading } = useRoleGuard("ADMIN");
  const { user } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [selectedRoleByUser, setSelectedRoleByUser] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [creatingRole, setCreatingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");

  const currentUserRoles = useMemo(() => extractRoleNames(user?.roles as RoleLike[] | undefined), [user?.roles]);

  const clearBanners = () => {
    setError("");
    setSuccess("");
  };

  const loadData = async () => {
    setLoading(true);
    clearBanners();

    try {
      const [usersData, rolesData] = await Promise.all([
        api.get<AdminUser[]>("/admin/users"),
        api.get<AdminRole[]>("/admin/roles"),
      ]);

      setUsers(usersData);
      setRoles(rolesData);

      const firstRole = rolesData[0]?.name ?? DEFAULT_ROLE;
      const nextSelection: Record<string, string> = {};
      for (const u of usersData) {
        nextSelection[u.egn] = firstRole;
      }
      setSelectedRoleByUser(nextSelection);
    } catch (e: any) {
      if (e?.status === 403) {
        setError("Only admins can access this page.");
      } else {
        setError(e?.message ?? "Failed to load admin data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    loadData();
  }, [authLoading]);

  const normalizedUsers = useMemo(() => {
    return users.map((u) => ({
      ...u,
      normalizedRoles: extractRoleNames(u.roles),
      displayName: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email || u.egn,
    }));
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return normalizedUsers;

    return normalizedUsers.filter((u) => {
      return (
        u.displayName.toLowerCase().includes(query) ||
        (u.email ?? "").toLowerCase().includes(query) ||
        u.egn.toLowerCase().includes(query)
      );
    });
  }, [normalizedUsers, search]);

  const updateUserRoles = (userId: string, nextRoles: string[]) => {
    setUsers((prev) =>
      prev.map((u) => (u.egn === userId ? { ...u, roles: nextRoles } : u))
    );
  };

  const applyRoleAction = async (userId: string, action: "set" | "add" | "remove") => {
    clearBanners();

    const roleName = selectedRoleByUser[userId];
    if (!roleName) {
      setError("Please select a role first.");
      return;
    }

    try {
      let result: RoleUpdateResponse;

      if (action === "set") {
        result = await api.put<RoleUpdateResponse>(`/admin/users/${userId}/role`, { roleName });
      } else if (action === "add") {
        result = await api.post<RoleUpdateResponse>(`/admin/users/${userId}/role`, { roleName });
      } else {
        result = await request<RoleUpdateResponse>(`/admin/users/${userId}/role`, {
          method: "DELETE",
          body: { roleName },
        });
      }

      updateUserRoles(userId, result.roles);
      setSuccess(result.message || "Role updated successfully.");
    } catch (e: any) {
      if (e?.status === 403) {
        setError("Only admins can perform role changes.");
        return;
      }
      setError(e?.message ?? "Role operation failed.");
    }
  };

  const onCreateRole = async (event: React.FormEvent) => {
    event.preventDefault();
    clearBanners();

    const name = newRoleName.trim();
    const description = newRoleDescription.trim();

    if (!name || !description) {
      setError("Role name and description are required.");
      return;
    }

    setCreatingRole(true);
    try {
      const created = await api.post<AdminRole>("/admin/roles", {
        name,
        description,
      });

      setRoles((prev) => [...prev, created]);
      setNewRoleName("");
      setNewRoleDescription("");
      setSuccess(`Role ${created.name} created successfully.`);
    } catch (e: any) {
      if (e?.status === 403) {
        setError("Only admins can create roles.");
      } else {
        setError(e?.message ?? "Failed to create role.");
      }
    } finally {
      setCreatingRole(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-8">
          <p className="text-sm text-gray-500 uppercase tracking-wide">Administration</p>
          <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-600 mt-2">Manage user roles with the Admin controller endpoints.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700 text-sm">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Users</h2>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or EGN"
                className="w-full sm:w-72 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--clr-primary)"
              />
            </div>

            {loading ? (
              <p className="text-sm text-gray-500">Loading users...</p>
            ) : filteredUsers.length === 0 ? (
              <p className="text-sm text-gray-500">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-200">
                      <th className="py-2 pr-3 font-semibold text-gray-700">User</th>
                      <th className="py-2 pr-3 font-semibold text-gray-700">Status</th>
                      <th className="py-2 pr-3 font-semibold text-gray-700">Current Roles</th>
                      <th className="py-2 pr-3 font-semibold text-gray-700">Select Role</th>
                      <th className="py-2 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.egn} className="border-b border-gray-100 align-top">
                        <td className="py-3 pr-3">
                          <p className="font-medium text-gray-900">{u.displayName}</p>
                          <p className="text-xs text-gray-500">{u.email ?? "No email"}</p>
                          <p className="text-xs text-gray-400">EGN: {u.egn}</p>
                        </td>
                        <td className="py-3 pr-3">
                          <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                            {u.status ?? "UNKNOWN"}
                          </span>
                        </td>
                        <td className="py-3 pr-3">
                          {u.normalizedRoles.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {u.normalizedRoles.map((r) => (
                                <span key={`${u.egn}-${r}`} className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${r === "ADMIN" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>
                                  {r}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">No roles</span>
                          )}
                        </td>
                        <td className="py-3 pr-3">
                          <select
                            className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs min-w-32"
                            value={selectedRoleByUser[u.egn] ?? DEFAULT_ROLE}
                            onChange={(e) => setSelectedRoleByUser((prev) => ({ ...prev, [u.egn]: e.target.value }))}
                          >
                            <option value={DEFAULT_ROLE} disabled>Select role</option>
                            {roles.map((role) => (
                              <option key={role.id} value={role.name}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => applyRoleAction(u.egn, "set")}
                              className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-(--clr-primary) text-white hover:bg-(--clr-primary-hover)"
                            >
                              Set
                            </button>
                            <button
                              type="button"
                              onClick={() => applyRoleAction(u.egn, "add")}
                              className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              Add
                            </button>
                            <button
                              type="button"
                              onClick={() => applyRoleAction(u.egn, "remove")}
                              className="px-2.5 py-1.5 rounded-md text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Role</h2>

            <form onSubmit={onCreateRole} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Role Name</label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. DISPATCHER"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--clr-primary)"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe what this role can do"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--clr-primary)"
                />
              </div>

              <button
                type="submit"
                disabled={creatingRole}
                className="w-full px-4 py-2 rounded-lg font-semibold text-white bg-(--clr-primary) hover:bg-(--clr-primary-hover) disabled:opacity-60"
              >
                {creatingRole ? "Creating..." : "Create Role"}
              </button>
            </form>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Available Roles</h3>
              {roles.length === 0 ? (
                <p className="text-xs text-gray-500">No roles loaded.</p>
              ) : (
                <ul className="space-y-2">
                  {roles.map((role) => (
                    <li key={role.id} className="rounded-lg border border-gray-200 p-2">
                      <p className="text-sm font-semibold text-gray-900">{role.name}</p>
                      <p className="text-xs text-gray-600">{role.description}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
