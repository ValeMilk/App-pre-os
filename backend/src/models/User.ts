import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hashed
  vendedor_code: { type: String },
  codigo_supervisor: { type: String },
  tipo: { type: String, enum: ['admin', 'vendedor', 'supervisor'], default: 'vendedor' },
  created_at: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
export default User;
