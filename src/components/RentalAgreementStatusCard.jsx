import React, { useState, useEffect } from 'react';
import { Card, Typography, Spin, Row, Col, Statistic } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, FileOutlined } from '@ant-design/icons';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const { Title } = Typography;

const RentalAgreementStatusCard = () => {
  const [stats, setStats] = useState({
    active: 0,
    pending: 0,
    expired: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const agreementsRef = collection(db, 'rentalAgreements');
        const agreementsSnapshot = await getDocs(agreementsRef);
        
        let activeCount = 0;
        let pendingCount = 0;
        let expiredCount = 0;
        
        agreementsSnapshot.forEach((doc) => {
          const agreement = doc.data();
          const currentDate = new Date();
          const endDate = agreement.endDate ? new Date(agreement.endDate) : null;
          
          if (agreement.status === 'active') {
            activeCount++;
          } else if (agreement.status === 'pending') {
            pendingCount++;
          }
          
          if (endDate && endDate < currentDate && agreement.status === 'active') {
            expiredCount++;
          }
        });
        
        setStats({
          active: activeCount,
          pending: pendingCount,
          expired: expiredCount,
          total: agreementsSnapshot.size
        });
      } catch (error) {
        console.error('Error fetching agreement stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <Card className="stats-card" title={<Title level={4}>Rental Agreements Summary</Title>}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={16}>
          <Col xs={12} sm={6}>
            <Statistic 
              title="Active Agreements" 
              value={stats.active} 
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />} 
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic 
              title="Pending Agreements" 
              value={stats.pending} 
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />} 
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic 
              title="Expired Agreements" 
              value={stats.expired} 
              prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />} 
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic 
              title="Total Agreements" 
              value={stats.total} 
              prefix={<FileOutlined />} 
            />
          </Col>
        </Row>
      )}
    </Card>
  );
};

export default RentalAgreementStatusCard;
