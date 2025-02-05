import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    profile: {
        username: '',
        email: undefined
    }
};

const user = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setProfile(state, action) {
            state.profile = action.payload;
        }
    }
});

export default user.reducer;

export const { setProfile } = user.actions;
