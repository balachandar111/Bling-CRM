import React from "react";
import API from "../services/api";
import { FaPlus } from "react-icons/fa";

const UserManagement = ({
  users,
  fetchUsers,
  handleEditUser,
  setSidebarOpen,
  editUserForm,
  setEditUserForm,
  showEditUserModal,
  setShowEditUserModal,
  updateUserData,
  userForm,
  handleUserChange,
  createUser,
  showUserModal,
  setShowUserModal
}) => {
  return (
    <>
<div className="employee-section">

     <div className="employee-header">

  <div className="header-left">

    <button
      className="sidebar-toggle"
      onClick={() =>
        setSidebarOpen(
          prev => !prev
        )
      }
    >
      ☰
    </button>

    <div>

      <h1>
        User Management
      </h1>

      <p>
        Manage users and roles
      </p>

    </div>

  </div>


  <div className="header-right">

    <button
      className="add-btn"
      onClick={() =>
        setShowUserModal(true)
      }
    >

      <FaPlus />

      Add User

    </button>

  </div>

</div>


      <div className="employee-table-wrapper">

        <table className="employee-table">

          <thead>

            <tr>

              <th>
                Name
              </th>

              <th>
                Email
              </th>

              <th>
                Role
              </th>

              <th>
                Change Role
              </th>

            </tr>

          </thead>


          <tbody>

            {
              users.map(
                (user) => (

                  <tr
                    key={user._id}
                  >

                    <td>
                      {user.name}
                    </td>

                    <td>
                      {user.email}
                    </td>

                    <td>
                      {user.role}
                    </td>

                  <td>

  <div
    style={{
      display: "flex",
      gap: "10px",
    }}
  >

    {/* ROLE */}

    <select

      value={
        user.role
      }

      onChange={
        async (e) => {

          try {

            await API.put(

              `/users/${user._id}/role`,

              {
                role:
                e.target.value,
              }
            );

            fetchUsers();

            alert(
              "Role Updated"
            );

          } catch (error) {

            console.log(error);
          }
        }
      }
    >

      <option value="user">

        User

      </option>

      <option value="super_admin">

        Super Admin

      </option>

    </select>


    {/* DELETE */}
    <button

  style={{
    background: "#2563EB",
    color: "white",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    cursor: "pointer",
  }}

  onClick={() =>
    handleEditUser(user)
  }
>

  Update

</button>

    <button

      style={{
        background: "#EF4444",
        color: "white",
        border: "none",
        padding: "8px 14px",
        borderRadius: "8px",
        cursor: "pointer",
      }}

      onClick={
        async () => {

          try {

            await API.delete(

              `/users/${user._id}`
            );

            fetchUsers();

            alert(
              "User Deleted"
            );

          } catch (error) {

            console.log(error);
          }
        }
      }
    >

      Delete

    </button>

  </div>

                    </td>

                  </tr>
                )
              )
            }

          </tbody>

        </table>

      </div>

    </div>
{showEditUserModal && (
<div className="modal-overlay">

      <div className="modal">

        <div className="modal-header">

          <h2>
            Update User
          </h2>

          <span

            className="close-icon"

            onClick={() =>
              setShowEditUserModal(false)
            }
          >

            ✕

          </span>

        </div>


        <form
          onSubmit={updateUserData}
        >

          <div className="form-grid">

            {/* NAME */}

            <div className="input-group">

              <label>
                Name
              </label>

              <input

                type="text"

                value={
                  editUserForm.name
                }

                onChange={(e) =>

                  setEditUserForm({

                    ...editUserForm,

                    name:
                    e.target.value,
                  })
                }
              />

            </div>


            {/* EMAIL */}

            <div className="input-group">

              <label>
                Email
              </label>

              <input

                type="email"

                value={
                  editUserForm.email
                }

                onChange={(e) =>

                  setEditUserForm({

                    ...editUserForm,

                    email:
                    e.target.value,
                  })
                }
              />

            </div>


            {/* PASSWORD */}

            <div className="input-group">

              <label>
                Password
              </label>

              <input

                type="password"

                placeholder="
Leave empty if no change
"

                value={
                  editUserForm.password
                }

                onChange={(e) =>

                  setEditUserForm({

                    ...editUserForm,

                    password:
                    e.target.value,
                  })
                }
              />

            </div>


            {/* ROLE */}

            <div className="input-group">

              <label>
                Role
              </label>

              <select

                value={
                  editUserForm.role
                }

                onChange={(e) =>

                  setEditUserForm({

                    ...editUserForm,

                    role:
                    e.target.value,
                  })
                }
              >

                <option value="user">

                  User

                </option>

                <option value="super_admin">

                  Super Admin

                </option>

              </select>

            </div>

          </div>


          <button
            type="submit"
            className="submit-btn"
          >

            Update User

          </button>

        </form>

      </div>

    </div>
)}
{showUserModal && (
<div className="modal-overlay">

      <div className="modal">

        <div className="modal-header">

          <h2>
            Add New User
          </h2>

          <span

            className="close-icon"

            onClick={() =>
              setShowUserModal(false)
            }
          >

            ✕

          </span>

        </div>


        <form
          onSubmit={createUser}
        >

          <div className="form-grid">

            {/* NAME */}

            <div className="input-group">

              <label>
                Name
              </label>

              <input

                type="text"

                name="name"

                placeholder="Enter name"

                value={
                  userForm.name
                }

                onChange={
                  handleUserChange
                }

                required
              />

            </div>


            {/* EMAIL */}

            <div className="input-group">

              <label>
                Email
              </label>

              <input

                type="email"

                name="email"

                placeholder="Enter email"

                value={
                  userForm.email
                }

                onChange={
                  handleUserChange
                }

                required
              />

            </div>


            {/* PASSWORD */}

            <div className="input-group">

              <label>
                Password
              </label>

              <input

                type="password"

                name="password"

                placeholder="Enter password"

                value={
                  userForm.password
                }

                onChange={
                  handleUserChange
                }

                required
              />

            </div>


            {/* ROLE */}

            <div className="input-group">

              <label>
                Role
              </label>

              <select

                name="role"

                value={
                  userForm.role
                }

                onChange={
                  handleUserChange
                }
              >

                <option value="user">

                  User

                </option>

                <option value="super_admin">

                  Super Admin

                </option>

              </select>

            </div>

          </div>


          <button
            type="submit"
            className="submit-btn"
          >

            Create User

          </button>

        </form>

      </div>

    </div>
)}
    </>
  );
};

export default UserManagement;