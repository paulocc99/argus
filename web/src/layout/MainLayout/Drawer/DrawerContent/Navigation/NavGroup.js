import { useSelector } from 'react-redux';

import { Box, List, Typography } from '@mui/material';

import NavItem from './NavItem';
import NavCollapse from './NavCollapse';

const NavGroup = ({ item }) => {
    const menu = useSelector((state) => state.menu);
    const { drawerOpen } = menu;

    const navCollapse = item.children?.map((menuItem) => {
        switch (menuItem.type) {
            case 'collapse':
                return <NavCollapse key={menuItem.id} item={menuItem} level={1} />;
            case 'item':
                return <NavItem key={menuItem.id} item={menuItem} level={1} />;
            default:
                return <></>;
        }
    });

    return (
        <List
            subheader={
                item.title &&
                drawerOpen && (
                    <Box sx={{ pl: 3, mb: 1.5 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                            {item.title}
                        </Typography>
                    </Box>
                )
            }
            sx={{ mb: drawerOpen ? 1.5 : 0, py: 0, zIndex: 0 }}
        >
            {navCollapse}
        </List>
    );
};

export default NavGroup;
