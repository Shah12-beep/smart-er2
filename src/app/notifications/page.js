"use client";
import Sidebar from '../components/sidebar';
import Navbar from '../components/navbar';
import { useState, useEffect } from "react";
import { FaBell, FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";
import { format } from 'timeago.js';



const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
   const [todaysPrediction, setTodaysPrediction] = useState(null);
    const [predictions, setPredictions] = useState([
    ]);
    const fetchTodaysPrediction = () => {
      fetch('http://localhost:5005/todays-prediction')
        .then(response => response.json())
        .then(data => {
          setTodaysPrediction(data.predicted_patient_count);
        })
        .catch(error => {
          console.error('Error fetching today\'s prediction:', error);
        });
    };
    const percentage = (((todaysPrediction/130)*100).toFixed(2))
  // Fetch notifications from backend
  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5001/notifications');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifications.map(notification => 
          fetch('http://localhost:5001/notifications/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notification_id: notification._id })
          })
        )
      );
      fetchNotifications(); // Refresh the list
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      setError(error.message);
    }
  };

  // Get notification icon and color based on type
  const getNotificationStyle = (type) => {
    switch(type) {
      case 'admission':
        return { 
          color: 'bg-blue-100 text-blue-500',
          icon: <FaInfoCircle className="text-2xl mr-3" />
        };
      case 'discharge':
        return { 
          color: 'bg-green-100 text-green-500',
          icon: <FaCheckCircle className="text-2xl mr-3" />
        };
      case 'Critical':
      default:
        return { 
          color: 'bg-red-100 text-red-500',
          icon: <FaExclamationTriangle className="text-2xl mr-3" />
        };
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchTodaysPrediction();
    const interval = setInterval(fetchNotifications, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-opacity-80 backdrop-blur-sm bg-blue-100">
      <Navbar/>
      <div className="flex mt-5 min-h-screen w-full flex-wrap">
        <Sidebar />
        <div className="flex-1 ml-3 mr-1">
          <div className="flex-1 flex justify-between items-center overflow-hidden p-3 drop-shadow-xl">
            <h1 className="text-gray-600 font-bold text-[clamp(1.5rem,3vw,2rem)] drop-shadow-lg ">
              Notifications
            </h1>
            <button 
              className="flex items-center gap-2 p-3 text-green-500 bg-green-100 hover:bg-blue-200 rounded-md shadow-md"
              onClick={markAllAsRead}
              disabled={loading || notifications.length === 0}
            >
              <FaCheckCircle /> Mark all as read
            </button>
          </div>

          {/* Notifications List */}
          <div className="mt-5 mb-3 mx-3 bg-white p-6 rounded-lg shadow-lg flex flex-col gap-3 ">
          
            <h2 className="text-xl font-semibold mb-4">Recent Alerts</h2>
            
            <div className="px-4 py-2 bg-red-100 text-gray-500">Todays Overcrowding prediction:{percentage}%</div>
            {loading ? (
              ""
            ) : error ? (
              
              <div className="bg-red-100 text-red-800 p-4 rounded-md">
                Error: {error}
              </div>
            ) : notifications.length > 0 ? (
              <div className="space-y-4">
                
                {notifications.map((notification) => {
                  const style = getNotificationStyle(notification.type);
                  return (
                    <div 
                      key={notification._id} 
                      className={`flex items-center justify-between p-4 rounded-lg ${style.color} shadow-md`}
                    >
                      
                      <div className='flex justify-between items-center'>
                      {style.icon}
                        <p className="text-lg">{notification.message}</p>
                        
                        
                      </div>
                      <p className="text-sm opacity-80 text-gray-500">
                          {format(notification.timestamp).toLocaleString()}
                        </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No new notifications</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;