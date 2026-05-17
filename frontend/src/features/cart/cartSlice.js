import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

const getToken = () => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  return user?.token || localStorage.getItem("token");
};

export const fetchCart = createAsyncThunk("cart/get", async (_, thunkAPI) => {
  try {
    const token = getToken();
    const res = await api.get("/cart", {
      headers: { Authorization: `Bearer ${token}` },
    });

    return res.data.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to fetch cart");
  }
});

export const addItemToCart = createAsyncThunk("cart/add", async (item, thunkAPI) => {
  try {
    const token = getToken();
    const res = await api.post(
      "/cart",
      { item },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return res.data.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to add item");
  }
});

export const updateCartItemQty = createAsyncThunk(
  "cart/updateQty",
  async ({ id, qty }, thunkAPI) => {
    try {
      const token = getToken();
      const res = await api.patch(
        `/cart/${id}`,
        { qty },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return res.data.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to update quantity");
    }
  }
);

export const removeItem = createAsyncThunk("cart/remove", async (id, thunkAPI) => {
  try {
    const token = getToken();
    const res = await api.delete(`/cart/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return res.data.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to remove item");
  }
});

export const clearCart = createAsyncThunk("cart/clear", async (_, thunkAPI) => {
  try {
    const token = getToken();
    await api.delete("/cart/clear", {
      headers: { Authorization: `Bearer ${token}` },
    });

    return { items: [] };
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.error || "Failed to clear cart");
  }
});

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    cart: null,
    isLoading: false,
    isError: false,
    message: "",
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cart = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(addItemToCart.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addItemToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.cart = action.payload;
      })
      .addCase(addItemToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateCartItemQty.fulfilled, (state, action) => {
        state.cart = action.payload;
      })
      .addCase(removeItem.fulfilled, (state, action) => {
        state.cart = action.payload;
      })
      .addCase(clearCart.fulfilled, (state) => {
        if (state.cart) state.cart.items = [];
      });
  },
});

export default cartSlice.reducer;
