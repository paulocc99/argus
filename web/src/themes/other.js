export const codeEditorStyle = {
    fontFamily: '"Fira code", "Fira Mono", monospace',
    fontSize: 12,
    background: '#f1f1f1',
    minHeight: '200px',
    overflow: 'scroll'
};

export const fabStyle = { position: 'fixed', bottom: (theme) => theme.spacing(4), right: (theme) => theme.spacing(4) };

export const filterTextStyle = {
    '& .MuiInputBase-input': { py: 0.5, fontSize: '0.875rem', background: 'none' }
};

export const listSummaryStyle = {
    px: 0,
    py: 0,
    '& .MuiListItemButton-root': {
        py: 1.5,
        '& .MuiAvatar-root': {
            width: 36,
            height: 36,
            fontSize: '1rem'
        },
        '& .MuiListItemSecondaryAction-root': {
            mt: 0.75,
            ml: 1,
            top: 'auto',
            right: 'auto',
            alignSelf: 'flex-start',
            transform: 'none',
            position: 'relative'
        }
    }
};
