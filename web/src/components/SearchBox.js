import { useState, useEffect } from 'react';
import { OutlinedInput, FormControl, FormHelperText, IconButton } from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

export default function SearchBox(props) {
    const { search, error, placeholder } = props;

    const [searchTerm, setSearchTerm] = useState('');
    const [timeoutId, setTimeoutId] = useState();

    const handleInputChange = (event) => {
        const value = event.target.value;

        clearTimeout(timeoutId);
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        // Set new timeout to trigger search after 500ms of inactivity
        setTimeoutId(
            setTimeout(() => {
                search(value);
            }, 500)
        );

        setSearchTerm(value);
    };

    useEffect(() => {
        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [timeoutId]);

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            search(searchTerm);
        } else if (event.key === 'Escape') {
            event.preventDefault();
            setSearchTerm('');
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        }
    };

    return (
        <FormControl>
            <OutlinedInput
                id="outlined-search"
                size="small"
                value={searchTerm}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                error={!!error}
                startAdornment={
                    <IconButton sx={{ padding: '10px' }}>
                        <SearchIcon />
                    </IconButton>
                }
                endAdornment={
                    searchTerm && (
                        <IconButton
                            onClick={() => {
                                setSearchTerm('');
                                if (timeoutId) {
                                    clearTimeout(timeoutId);
                                }
                            }}
                            sx={{ padding: '10px' }}
                        >
                            <ClearIcon />
                        </IconButton>
                    )
                }
            />
            {error && <FormHelperText error>{error}</FormHelperText>}
        </FormControl>
    );
}
