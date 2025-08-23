import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchSellerProfile } from "../../features/profile/profileSlice";
import axios from "axios";
import {
  Box,
  Avatar,
  Typography,
  CircularProgress,
  Container,
  Button,
  Snackbar,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
  Tooltip,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";

const SellerProfile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const token = localStorage.getItem("token");
  const { sellerId } = useParams();
  const { seller, loading, error } = useSelector((state) => state.profile);

  const [avatarError, setAvatarError] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [reviews, setReviews] = useState(null);
  useEffect(() => {
    if (sellerId) {
      dispatch(fetchSellerProfile(sellerId));
    }
  }, [dispatch, sellerId]);

  useEffect(() => {
    const fetchReviews = async () => {
      const res = await axios.get(
        `http://localhost:9999/api/buyers/feedback/getPositiveReviews/${sellerId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setReviews(res.data.data); // API trả mảng thì gán vào đây
    };

    fetchReviews();
  }, [sellerId]);

  console.log(reviews);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "70vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
        <Button
          variant="contained"
          onClick={() => dispatch(fetchSellerProfile(sellerId))}
        >
          Thử lại
        </Button>
      </Box>
    );
  }

  if (!seller) {
    return (
      <Box sx={{ textAlign: "center", mt: 4 }}>
        <Typography variant="h6">Không có dữ liệu người bán</Typography>
      </Box>
    );
  }

  const avatarUrl =
    seller.avatarURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      seller.fullname || seller.username || "User"
    )}`;
  return (
    <Container maxWidth="md" sx={{ p: { xs: 2, md: 3 } }}>
      <Card
        elevation={3}
        sx={{ borderRadius: 4, overflow: "hidden", mt: { xs: 4, md: 6 } }}
      >
        <Box
          sx={{
            bgcolor: "primary.main",
            height: 100,
            width: "100%",
            position: "relative",
          }}
        />

        <CardContent
          sx={{ p: { xs: 2, md: 4 }, pt: 0, mt: -6, position: "relative" }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={avatarError ? null : avatarUrl}
                alt={seller.fullname || seller.username}
                sx={{
                  width: 120,
                  height: 120,
                  border: "4px solid white",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                  bgcolor: avatarError ? "error.light" : "primary.light",
                }}
              >
                {avatarError && <PersonIcon sx={{ fontSize: 60 }} />}
              </Avatar>
            </Box>

            <Box sx={{ width: "100%", mt: 4 }}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1 }}>
                  {seller.fullname || seller.username || "No name"}
                </Typography>
              </Box>

              <Box sx={{ mt: 4 }}>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Username
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                      {seller.username}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                      {seller.email}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Vai trò
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: "medium", textTransform: "capitalize" }}
                    >
                      {seller.role === "buyer"
                        ? "Người mua"
                        : seller.role === "seller"
                        ? "Người bán"
                        : seller.role}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Điểm uy tín
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: "medium", textTransform: "capitalize" }}
                    >
                      {reviews
                        ? `${Math.round(reviews.reputationScore)} / 100`
                        : "Chưa có"}
                    </Typography>
                  </Grid>
                </Grid>

                {seller.action && (
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color:
                          seller.action === "lock"
                            ? "error.main"
                            : "success.main",
                      }}
                    >
                      Trạng thái:{" "}
                      {seller.action === "lock"
                        ? "Tài khoản bị khóa"
                        : "Đang hoạt động"}
                    </Typography>
                  </Box>
                )}

                <Tooltip title="ID tài khoản" arrow placement="top">
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", textAlign: "center", mt: 4 }}
                  >
                    ID: {seller._id}
                  </Typography>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Success Message */}
      <Snackbar
        open={!!successMsg}
        autoHideDuration={3000}
        onClose={() => setSuccessMsg("")}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSuccessMsg("")}
          severity="success"
          sx={{ width: "100%" }}
        >
          {successMsg}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SellerProfile;
