// 📁 src/pages/ReminderPage.jsx

import React, {
  useEffect,
  useState,
} from "react";

import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

import {
  FaBell,
  FaPhoneAlt,
  FaBuilding,
  FaUserTie,
} from "react-icons/fa";

const ReminderPage = ({
  customers = [],
}) => {

  // ================= STATES =================

  const [selectedDate, setSelectedDate] =
    useState(new Date());

  const [selectedCustomers,
    setSelectedCustomers] =
    useState([]);

  const [todayReminders,
    setTodayReminders] =
    useState([]);

  // ================= FORMAT DATE =================

  const formatDate = (date) => {

    return new Date(date)
      .toISOString()
      .split("T")[0];
  };

  // ================= TODAY REMINDERS =================

  useEffect(() => {

    const today =
      formatDate(new Date());

    const reminders =
      customers.filter(
        (customer) =>

          customer.followUpDate
            ?.slice(0, 10) === today
      );

    setTodayReminders(reminders);

  }, [customers]);

  // ================= SELECTED DATE FILTER =================

  useEffect(() => {

    const formatted =
      formatDate(selectedDate);

    const filtered =
      customers.filter(
        (customer) =>

          customer.followUpDate
            ?.slice(0, 10) ===
          formatted
      );

    setSelectedCustomers(
      filtered
    );

  }, [selectedDate, customers]);

  // ================= BROWSER NOTIFICATION =================

  useEffect(() => {

    if (
      Notification.permission !==
      "granted"
    ) {

      Notification.requestPermission();
    }

    if (
      todayReminders.length > 0
    ) {

      new Notification(
        "CRM Reminder",
        {

          body:
            `You have ${todayReminders.length} follow-up(s) today`,
        }
      );
    }

  }, [todayReminders]);

  return (

    <div className="reminder-page">

      {/* HEADER */}

      <div className="reminder-header">

        <div>

          <h1>
            Follow Up Reminders
          </h1>

          <p>
            Track customer follow-ups
            by selecting a date
          </p>

        </div>

      </div>


      {/* TODAY ALERT */}

      {
        todayReminders.length > 0 && (

          <div className="today-alert">

            <FaBell />

            You have
            {" "}
            <strong>
              {
                todayReminders.length
              }
            </strong>
            {" "}
            follow-up(s) today

          </div>
        )
      }


      {/* MAIN GRID */}

      <div className="reminder-grid">


        {/* CALENDAR */}

        <div className="calendar-card">

          <h2>
            Select Follow Up Date
          </h2>

          <Calendar

            onChange={
              setSelectedDate
            }

            value={
              selectedDate
            }

            tileClassName={({
              date,
            }) => {

              const formatted =
                formatDate(date);

              const hasReminder =
                customers.some(
                  (customer) =>

                    customer.followUpDate
                      ?.slice(0, 10) ===
                    formatted
                );

              return hasReminder
                ? "highlight-date"
                : null;
            }}
          />

        </div>


        {/* CUSTOMER LIST */}

        <div className="customer-list-card">

          <div className="list-header">

            <h2>
              Customers Follow Up List
            </h2>

            <span className="selected-date">

              {
                selectedDate.toDateString()
              }

            </span>

          </div>


          {
            selectedCustomers.length === 0 ? (

              <div className="empty-state">

                No follow-ups found
                for this date

              </div>

            ) : (

              selectedCustomers.map(
                (customer) => (

                  <div

                    key={
                      customer._id
                    }

                    className="customer-card"
                  >

                    <div className="customer-left">

                      <h3>
                        {
                          customer.name
                        }
                      </h3>

                      <p>

                        <FaBuilding />

                        {
                          customer.company
                        }

                      </p>

                      <p>

                        <FaPhoneAlt />

                        {
                          customer.phone
                        }

                      </p>

                      <p>

                        <FaUserTie />

                        Assigned:
                        {" "}
                        {
                          customer.assignedTo
                        }

                      </p>

                    </div>


                    <div className="customer-right">

                      <span className="priority-badge">

                        {
                          customer.priority
                        }

                      </span>

                      <span className="stage-badge">

                        {
                          customer.leadStage
                        }

                      </span>

                    </div>

                  </div>
                )
              )
            )
          }

        </div>

      </div>


      {/* CSS */}

      <style>

        {`

        .reminder-page {
          padding: 25px;
          background: #F3F4F6;
          min-height: 100vh;
        }

        .reminder-header h1 {
          font-size: 32px;
          font-weight: 700;
          color: #111827;
        }

        .reminder-header p {
          color: #6B7280;
          margin-top: 6px;
        }

        .today-alert {
          margin-top: 20px;
          background: #FEF3C7;
          color: #92400E;
          padding: 15px 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
        }

        .reminder-grid {
          margin-top: 25px;
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 25px;
        }

        .calendar-card,
        .customer-list-card {
          background: white;
          padding: 25px;
          border-radius: 20px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        }

        .calendar-card h2,
        .customer-list-card h2 {
          margin-bottom: 20px;
          color: #111827;
        }

        .react-calendar {
          width: 100%;
          border: none;
          font-family: inherit;
        }

        .react-calendar__tile {
          padding: 15px 0;
          border-radius: 10px;
        }

        .highlight-date {
          background: #2563EB !important;
          color: white !important;
          border-radius: 50%;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .selected-date {
          background: #2563EB;
          color: white;
          padding: 8px 15px;
          border-radius: 30px;
          font-size: 13px;
        }

        .customer-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #F9FAFB;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 18px;
          transition: 0.3s;
        }

        .customer-card:hover {
          transform: translateY(-3px);
        }

        .customer-left h3 {
          margin: 0;
          color: #111827;
        }

        .customer-left p {
          margin-top: 10px;
          color: #6B7280;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .customer-right {
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: flex-end;
        }

        .priority-badge {
          background: #F59E0B;
          color: white;
          padding: 8px 14px;
          border-radius: 30px;
          font-size: 12px;
        }

        .stage-badge {
          background: #10B981;
          color: white;
          padding: 8px 14px;
          border-radius: 30px;
          font-size: 12px;
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
          color: #9CA3AF;
          font-size: 18px;
        }

        @media(max-width: 900px) {

          .reminder-grid {
            grid-template-columns: 1fr;
          }
        }

        `}
      </style>

    </div>
  );
};

export default ReminderPage;