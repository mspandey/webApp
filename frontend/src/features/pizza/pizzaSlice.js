import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { demoPizzas } from "./demoData";
import { fetchPizzas } from "./pizzaService";

export const getPizzas = createAsyncThunk("pizza/getAll", async (_, thunkAPI) => {
  try {
    return await fetchPizzas();
  } catch (error) {
    return thunkAPI.rejectWithValue(
      error.response?.data?.error || "Live menu unavailable. Showing chef specials."
    );
  }
});

const pizzaSlice = createSlice({
  name: "pizza",
  initialState: {
    pizzas: [],
    isLoading: false,
    isError: false,
    message: "",
    usingDemoMenu: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getPizzas.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = "";
      })
      .addCase(getPizzas.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pizzas = action.payload;
        state.usingDemoMenu = action.payload.some((pizza) => pizza._id?.startsWith("demo-"));
      })
      .addCase(getPizzas.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.pizzas = demoPizzas;
        state.usingDemoMenu = true;
      })
      .addCase(loadDraft, (state, action) => {
    return { ...state, ...action.payload };
  })
      .addCase(clearDraft, (state) => {
        state.toppings = [];
        state.size = "medium";
        state.crust = "thin";
        state.sauce = "tomato";
      })
});

export default pizzaSlice.reducer;
export const {
  // ...your existing exports...,
  loadDraft,
  clearDraft,
} = pizzaSlice.actions;
