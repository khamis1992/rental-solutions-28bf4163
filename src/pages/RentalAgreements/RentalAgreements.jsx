import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import "./RentalAgreements.css";
import Navbar from "../../components/Navbar/Navbar";

const RentalAgreements = () => {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAgreements = async () => {
      try {
        const agreementsCollection = collection(db, "rental-agreements");
        const agreementsSnapshot = await getDocs(agreementsCollection);
        const agreementsList = agreementsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAgreements(agreementsList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching rental agreements: ", error);
        setLoading(false);
      }
    };

    fetchAgreements();
  }, []);

  const handleViewDetails = (agreementId) => {
    navigate(`/rental-agreements/${agreementId}`);
  };

  const filteredAgreements = agreements.filter(agreement => {
    if (!searchTerm) return true;
    
    // Convert search term and vehicle information to lowercase for case-insensitive search
    const search = searchTerm.toLowerCase();
    const vehicleMake = agreement.vehicleMake?.toLowerCase() || '';
    const vehicleModel = agreement.vehicleModel?.toLowerCase() || '';
    const vehicleYear = agreement.vehicleYear?.toString() || '';
    const vehicleReg = agreement.vehicleRegistration?.toLowerCase() || '';
    
    // Search across all vehicle-related fields
    return vehicleMake.includes(search) || 
           vehicleModel.includes(search) || 
           vehicleYear.includes(search) || 
           vehicleReg.includes(search);
  });

  return (
    <div className="rental-agreements-page">
      <Navbar />
      <div className="rental-agreements-container">
        <h1>Rental Agreements</h1>
        
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by vehicle make, model, year, or registration"
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <p>Loading rental agreements...</p>
        ) : (
          <>
            {filteredAgreements.length === 0 ? (
              <p>No rental agreements found.</p>
            ) : (
              <div className="agreements-list">
                {filteredAgreements.map((agreement) => (
                  <div key={agreement.id} className="agreement-card">
                    <div className="agreement-header">
                      <h3>
                        {agreement.vehicleYear} {agreement.vehicleMake}{" "}
                        {agreement.vehicleModel}
                      </h3>
                      <p>Registration: {agreement.vehicleRegistration}</p>
                    </div>
                    <div className="agreement-details">
                      <p>
                        <strong>Client:</strong> {agreement.clientName}
                      </p>
                      <p>
                        <strong>Duration:</strong> {agreement.rentalDuration}{" "}
                        days
                      </p>
                      <p>
                        <strong>Start Date:</strong> {agreement.startDate}
                      </p>
                      <p>
                        <strong>End Date:</strong> {agreement.endDate}
                      </p>
                    </div>
                    <button
                      onClick={() => handleViewDetails(agreement.id)}
                      className="view-details-btn"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RentalAgreements;
