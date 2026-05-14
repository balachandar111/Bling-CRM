// 📁 src/pages/EmployeeProfile.jsx

import React,
{
  useEffect,
  useState,
} from "react";

import API from "../services/api";

import {
  useNavigate,
} from "react-router-dom";

import {

  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaBriefcase,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaFilePdf,
  FaUserTie,
  FaSignOutAlt,
  FaEdit,

} from "react-icons/fa";

import "./EmployeeProfile.css";


const EmployeeProfile = () => {

  const navigate =
    useNavigate();


  // ================= STATES =================

  const [employee, setEmployee] =
    useState(null);

  const [showUpdate, setShowUpdate] =
    useState(false);

  const [updateData, setUpdateData] =
    useState({

      email: "",

      profileImage: null,

      documents: null,
    });


  // ================= FETCH PROFILE =================

  const fetchProfile =
  async () => {

    try {

      const token =
        localStorage.getItem(
          "token"
        );

      const { data } =
        await API.get(

          "/employees/profile",

          {
            headers: {

              Authorization:
              `Bearer ${token}`,
            },
          }
        );

      setEmployee(
        data.employee
      );

    } catch (error) {

      console.log(error);
    }
  };


  useEffect(() => {

    fetchProfile();

  }, []);


  // ================= HANDLE INPUT =================

  const handleChange =
  (e) => {

    setUpdateData({

      ...updateData,

      [e.target.name]:
        e.target.value,
    });
  };


  // ================= HANDLE FILE =================

 const handleFileChange =
(e) => {

  setUpdateData({

    ...updateData,

    [e.target.name]:
    e.target.files[0],
  });
};


  // ================= UPDATE PROFILE =================

 const updateProfile =
async (e) => {

  e.preventDefault();

  try {

    const token =
      localStorage.getItem(
        "token"
      );


    // ================= EMAIL =================

    if (updateData.email) {

      await API.put(

        "/employees/update-email",

        {
          email:
          updateData.email,
        },

        {
          headers: {

            Authorization:
            `Bearer ${token}`,
          },
        }
      );
    }


    // ================= IMAGE =================

    if (
      updateData.profileImage
    ) {

      const imageData =
        new FormData();

      imageData.append(

        "profileImage",

        updateData.profileImage
      );

      await API.put(

        "/employees/update-image",

        imageData,

        {
          headers: {

            Authorization:
            `Bearer ${token}`,
          },
        }
      );
    }


    // ================= DOCUMENT =================

  if (
  updateData.document
) {

  const docData =
  new FormData();

  docData.append(

    "document",

    updateData.document
  );

  await API.put(

    "/employees/update-document",

    docData,

    {
      headers: {

        Authorization:
        `Bearer ${token}`,
      },
    }
  );
}

    alert(
      "Profile Updated Successfully"
    );

    fetchProfile();

    setShowUpdate(false);

  } catch (error) {

    console.log(
      error.response?.data
    );

    alert(

      error.response?.data?.message ||

      "Update failed"
    );
  }
};


  // ================= LOGOUT =================

  const handleLogout = () => {

    localStorage.removeItem(
      "token"
    );

    navigate(
      "/login"
    );
  };


  return (

    <div className="employee-page">

      {
        employee && (

          <div className="profile-container">


            {/* ================= SIDEBAR ================= */}

            <div className="profile-sidebar">


              {/* IMAGE */}

              <div className="profile-image-box">

                <img

                  src={
                    employee.profileImage
                  }

                  alt="profile"

                  className="profile-image"
                />

              </div>


              {/* NAME */}

              <h1>
                {employee.name}
              </h1>

              <p>
                {employee.designation}
              </p>


              {/* BADGE */}

              <div className="profile-badge">

                <FaUserTie />

                Employee Portal

              </div>


              {/* ACTIONS */}

              <div className="profile-actions">


                {/* UPDATE */}

                <button

                  className="edit-profile-btn"

                  onClick={() => {

                    setUpdateData({

                      email:
                        employee.email || "",

                      profileImage:
                        null,

                      documents:
                        null,
                    });

                    setShowUpdate(true);
                  }}
                >

                  <FaEdit />

                  Update Profile

                </button>


                {/* LOGOUT */}

                <button

                  className="logout-profile-btn"

                  onClick={
                    handleLogout
                  }
                >

                  <FaSignOutAlt />

                  Logout

                </button>

              </div>

            </div>


            {/* ================= CONTENT ================= */}

            <div className="profile-content">


              {/* HEADER */}

              <div className="profile-header">

                <div>

                  <h2>
                    Employee Information
                  </h2>

                  <span>
                    Professional Employee Profile
                  </span>

                </div>

              </div>


              {/* DETAILS */}

              <div className="details-grid">


                {/* EMAIL */}

                <div className="detail-card">

                  <FaEnvelope className="detail-icon" />

                  <div>

                    <span>
                      Email
                    </span>

                    <h3>
                      {employee.email}
                    </h3>

                  </div>

                </div>


                {/* PHONE */}

                <div className="detail-card">

                  <FaPhone className="detail-icon" />

                  <div>

                    <span>
                      Phone
                    </span>

                    <h3>
                      {employee.phone}
                    </h3>

                  </div>

                </div>


                {/* DEPARTMENT */}

                <div className="detail-card">

                  <FaBuilding className="detail-icon" />

                  <div>

                    <span>
                      Department
                    </span>

                    <h3>
                      {employee.department}
                    </h3>

                  </div>

                </div>


                {/* DESIGNATION */}

                <div className="detail-card">

                  <FaBriefcase className="detail-icon" />

                  <div>

                    <span>
                      Designation
                    </span>

                    <h3>
                      {employee.designation}
                    </h3>

                  </div>

                </div>


                {/* SALARY */}

                <div className="detail-card">

                  <FaMoneyBillWave className="detail-icon" />

                  <div>

                    <span>
                      Salary
                    </span>

                    <h3>
                      ₹{employee.salary}
                    </h3>

                  </div>

                </div>


                {/* JOINING DATE */}

                <div className="detail-card">

                  <FaCalendarAlt className="detail-icon" />

                  <div>

                    <span>
                      Joining Date
                    </span>

                    <h3>

                      {
                        employee.joiningDate?.slice(
                          0,
                          10
                        )
                      }

                    </h3>

                  </div>

                </div>

              </div>


              {/* ================= DOCUMENTS ================= */}

              <div className="document-section">

                <div className="section-title">

                  <h2>
                    Uploaded Documents
                  </h2>

                </div>


                <div className="document-grid">

                  {
                    employee.documents?.length > 0

                    ? (

                      employee.documents.map(

                        (
                          doc,
                          index
                        ) => (

                          <a

                            key={index}

                            href={doc}

                            target="_blank"

                            rel="noreferrer"

                            className="document-card"
                          >

                            <FaFilePdf className="pdf-icon" />

                            <span>

                              Document {index + 1}

                            </span>

                          </a>
                        )
                      )
                    )

                    : (

                      <p>
                        No documents uploaded
                      </p>
                    )
                  }

                </div>

              </div>

            </div>

          </div>
        )
      }


      {/* ================= UPDATE MODAL ================= */}

      {
        showUpdate && (

          <div className="modal-overlay">

            <div className="update-modal">


              {/* HEADER */}

              <div className="modal-header">

                <h2>
                  Update Profile
                </h2>

                <span

                  className="close-icon"

                  onClick={() =>
                    setShowUpdate(false)
                  }
                >

                  ✕

                </span>

              </div>


              {/* FORM */}

              <form
                onSubmit={
                  updateProfile
                }
              >


                {/* EMAIL */}

                <div className="input-group">

                  <label>
                    Email Address
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={
                      updateData.email
                    }
                    onChange={
                      handleChange
                    }
                  />

                </div>


                {/* PROFILE */}

                <div className="input-group">

                  <label>
                    Update Profile Image
                  </label>
<input

  type="file"

  name="profileImage"

  accept="image/*"

  onChange={
    handleFileChange
  }
/>



                </div>


                {/* DOCUMENT */}

                <div className="input-group">

                  <label>
                    Update Document
                  </label>
<input

  type="file"

  name="document"

  accept=".pdf"

  onChange={
    handleFileChange
  }
/>

                </div>


                {/* BUTTON */}

                <button
                  type="submit"
                  className="submit-btn"
                >

                  Save Changes

                </button>

              </form>

            </div>

          </div>
        )
      }

    </div>
  );
};

export default EmployeeProfile;