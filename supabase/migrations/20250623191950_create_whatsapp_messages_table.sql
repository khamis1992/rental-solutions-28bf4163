-- Create WhatsApp messages table for tracking sent messages
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  message_content TEXT NOT NULL,
  message_type VARCHAR(50) NOT NULL DEFAULT 'general',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  twilio_message_id VARCHAR(100),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cost DECIMAL(10, 4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone ON whatsapp_messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_type ON whatsapp_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_sent_at ON whatsapp_messages(sent_at);

-- Add comments
COMMENT ON TABLE whatsapp_messages IS 'WhatsApp messages sent via Twilio';
COMMENT ON COLUMN whatsapp_messages.message_type IS 'Message type: payment_reminder, overdue_payment, payment_received, general';
COMMENT ON COLUMN whatsapp_messages.status IS 'Message status: sent, failed, pending';
