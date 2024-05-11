import { SignIn } from "@clerk/nextjs";
import React from "react";

const Signin = () => {
  return <SignIn path="/sign-in" />;
};

export default Signin;
