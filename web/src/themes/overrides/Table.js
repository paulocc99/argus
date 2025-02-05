export const TableContainerStyle = {
    width: '100%',
    overflowX: 'auto',
    position: 'relative',
    display: 'block',
    maxWidth: '100%',
    '& td, & th': { whiteSpace: 'nowrap' }
};

export const TableStyle = {
    '& .MuiTableCell-root:first-of-type': {
        pl: 2
    },
    '& .MuiTableCell-root:last-of-type': {
        pr: 3
    }
};

export const TableRowStyle = {
    '&:last-child td, &:last-child th': { border: 0 },
    cursor: 'pointer'
};
