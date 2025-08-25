import React, { useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import ComplaintList from "./ComplaintList";

const AdminComplaint = () => {
  const { handleSetDashboardTitle } = useOutletContext();

  useEffect(() => {
    handleSetDashboardTitle("Complaint Management");
  }, [handleSetDashboardTitle]);

  return <ComplaintList />;
};

export default AdminComplaint;
