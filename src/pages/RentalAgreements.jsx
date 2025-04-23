import React, { useState } from 'react';
import { Button, Table, Modal, Form, Input, DatePicker } from 'antd';
import RentalAgreementStatusCard from '../components/RentalAgreementStatusCard';

const RentalAgreements = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleOk = () => {
    form.validateFields().then(values => {
      console.log('Form values:', values);
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Rental Agreements</h1>
        <Button type="primary" onClick={() => setIsModalVisible(true)}>
          Add New Rental Agreement
        </Button>
      </div>
      
      <RentalAgreementStatusCard />
      
      <div style={{ marginTop: '20px' }}>
        {/* Search and filter controls */}
        <Input.Search placeholder="Search rental agreements" style={{ width: 200 }} />
        <DatePicker.RangePicker style={{ marginLeft: '10px' }} />
      </div>
      
      <Table
        style={{ marginTop: '20px' }}
        columns={[
          { title: 'Agreement ID', dataIndex: 'id', key: 'id' },
          { title: 'Customer Name', dataIndex: 'customerName', key: 'customerName' },
          { title: 'Start Date', dataIndex: 'startDate', key: 'startDate' },
          { title: 'End Date', dataIndex: 'endDate', key: 'endDate' },
          { title: 'Status', dataIndex: 'status', key: 'status' },
        ]}
        dataSource={[]}
      />

      <Modal
        title="Add New Rental Agreement"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="customerName"
            label="Customer Name"
            rules={[{ required: true, message: 'Please enter the customer name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="startDate"
            label="Start Date"
            rules={[{ required: true, message: 'Please select the start date' }]}
          >
            <DatePicker />
          </Form.Item>
          <Form.Item
            name="endDate"
            label="End Date"
            rules={[{ required: true, message: 'Please select the end date' }]}
          >
            <DatePicker />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RentalAgreements;