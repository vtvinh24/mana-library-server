const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  book: {
    type: Schema.Types.ObjectId,
    ref: "Book",
    required: function () {
      return ["borrow", "return", "reserve"].includes(this.type);
    },
  },
  type: {
    type: String,
    enum: ["borrow", "return", "reserve", "cancel_reservation", "fine_payment"],
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  dueDate: {
    type: Date,
    required: function () {
      return this.type === "borrow";
    },
  },
  lateFee: {
    type: Number,
    required: function () {
      return this.type === "return" && this.lateFee > 0;
    },
  },
  amount: {
    type: Number,
    required: function () {
      return this.type === "fine_payment";
    },
  },
  paymentMethod: {
    type: String,
    enum: ["credit_card", "debit_card", "cash", "online"],
    required: function () {
      return this.type === "fine_payment";
    },
  },
  externalTransactionId: {
    type: String,
    required: function () {
      return this.type === "fine_payment";
    },
  },
});

module.exports = mongoose.model("Transaction", transactionSchema);
