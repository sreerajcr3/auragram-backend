import otpGenerator from "otp-generator"; 
import OTP from "../models/otp";
import User from "../models/user";
import { RequestHandler } from "express";
import createHttpError from "http-errors";

export const sendOTP: RequestHandler = async (req, res, next) => {
  try {
    const { email } = req.body;

    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    let result = await OTP.findOne({ otp: otp });
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
      });
      result = await OTP.findOne({ otp: otp });
    }
    const otpPayload = { email, otp };
    await OTP.create(otpPayload);
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      otp,
    });
  } catch (error) {
    next(error)
  }
};

export const forgetPasswordsendOTP: RequestHandler = async (req, res, next) => {
  try {
    const { email } = req.body;
    const checkUserPresent = await User.findOne({ email });
    if (checkUserPresent) {
        throw createHttpError(401, { success: false, message: 'User is already registered' })
    }

    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    let result = await OTP.findOne({ otp: otp });
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
      });
      result = await OTP.findOne({ otp: otp });
    }
    const otpPayload = { email, otp };
    await OTP.create(otpPayload);
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      otp,
    });
  } catch (error) {
    next(error)
  }
};

export default sendOTP;