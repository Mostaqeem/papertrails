import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import editIcon from "../../../assets/icons/edit.svg";
import deleteIcon from "../../../assets/icons/trash.svg";
import axiosInstance from "../../../axiosConfig";

/**
 * UserConfig - Configuration page for managing users
 */
const UserConfig = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // TODO: Fetch users from API
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get("accounts/users-config/");
      // console.log("Users response:", response.data);
      let usersList = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];
      // console.log("Parsed users list:", usersList);
      setUsers(usersList);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    navigate("/user-management/all-users/add");
  };
  const handleEdit = (userId) => {
    navigate(`/user-management/all-users/${userId}/edit`);
  };
  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      await axiosInstance.delete(`/users/${userId}/`);
      setUsers(users.filter((user) => user.id !== userId));
      setError(null);
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Failed to delete user");
    }
  };

  return (
    <div className="config-page">
      <div className="config-header">
        <h2>User Management Configuration</h2>
        <button className="btn btn-primary" onClick={() => handleAddUser()}>
          Add User
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div>Loading users...</div>
      ) : (
        <div className="config-table">
          <table>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Designation</th>
                <th className="actions-cell">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="3">No users configured yet.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.full_name}</td>
                    <td>{user.email}</td>
                    <td>{user.department_name}</td>
                    <td>{user.short__designation || "N/A"}</td>
                    <td className="actions-cell">
                      <button
                        className="icon-btn edit-btn"
                        title="Edit"
                        onClick={() => handleEdit(user.id)}
                      >
                        <img src={editIcon} alt="Edit" />
                      </button>
                      <button
                        className="icon-btn delete-btn"
                        title="Delete"
                        onClick={() => handleDelete(user.id)}
                      >
                        <img src={deleteIcon} alt="Delete" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserConfig;
