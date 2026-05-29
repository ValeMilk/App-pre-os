import mongoose from 'mongoose';

const priceRequestSchema = new mongoose.Schema({
  requester_name: String,
  requester_id: { type: String, required: true },
  customer_code: String,
  customer_name: String,
  product_id: String,
  product_name: String,
  requested_price: String,
  quantity: String,
  product_maximo: String,
  product_minimo: String,
  product_promocional: String,
  currency: String,
  status: String,
  notes: String,
  created_at: { type: Date, default: Date.now },
  approved_by: String,
  approved_at: Date,
  altered_by: String,
  altered_at: Date,
  codigo_supervisor: String,
  nome_supervisor: String,
  subrede_batch_id: String,
  subrede_name: String,
  discount_percent: String,
  discounted_price: String,
  supervisor_notes: String,
  gerente_approved_by: String,
  gerente_approved_at: Date,
  gerente_rejected_by: String,
  gerente_rejected_at: Date,
  cancellation_requested: { type: Boolean, default: false },
  cancellation_reason: String,
  cancellation_requested_at: Date
});

// Evitar recriar o modelo se já existe
export const PriceRequest = mongoose.models.PriceRequest || mongoose.model('PriceRequest', priceRequestSchema);
