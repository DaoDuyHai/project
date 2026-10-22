import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["student", "teacher", "dispatcher", "admin"],
      default: "student",
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
