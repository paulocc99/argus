import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { ListItemButton, ListItemIcon, ListItemText, Typography, Collapse, List } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

import { activeItem } from 'store/reducers/menu';
import NavItem from './NavItem';

const NavCollapse = ({ item, level }) => {
    const dispatch = useDispatch();
    const menu = useSelector((state) => state.menu);
    const { drawerOpen, openItem } = menu;

    const itemHandler = (id) => {
        if (isSelected) {
            dispatch(activeItem({ openItem: [] }));
            return;
        }
        dispatch(activeItem({ openItem: [id] }));
    };

    const Icon = item.icon;
    const itemIcon = item.icon ? <Icon style={{ fontSize: drawerOpen ? '1rem' : '1.25rem' }} /> : false;

    const allIds = [item.id, ...item.children.map((c) => c.id)];
    const isSelected = openItem.findIndex((id) => allIds.includes(id)) > -1;

    useEffect(() => {
        const currentIndex = document.location.pathname
            .toString()
            .split('/')
            .findIndex((id) => id === item.id);
        if (currentIndex > -1) {
            dispatch(activeItem({ openItem: [item.id] }));
        }
    }, []);

    const textColor = 'text.primary';

    return (
        <>
            <ListItemButton
                disabled={item.disabled}
                onClick={() => itemHandler(item.id)}
                sx={{
                    zIndex: 1201,
                    pl: drawerOpen ? `${level * 28}px` : 1.5,
                    py: !drawerOpen && level === 1 ? 1.25 : 1,
                    ...(drawerOpen && {
                        '&:hover': {
                            bgcolor: 'primary.lighter'
                        }
                    }),
                    ...(!drawerOpen && {
                        '&:hover': {
                            bgcolor: 'transparent'
                        }
                    })
                }}
            >
                {itemIcon && (
                    <ListItemIcon
                        sx={{
                            minWidth: 28,
                            color: textColor,
                            ...(!drawerOpen && {
                                borderRadius: 1.5,
                                width: 36,
                                height: 36,
                                alignItems: 'center',
                                justifyContent: 'center',
                                '&:hover': {
                                    bgcolor: 'secondary.lighter'
                                }
                            })
                        }}
                    >
                        {itemIcon}
                    </ListItemIcon>
                )}
                {(drawerOpen || (!drawerOpen && level !== 1)) && (
                    <ListItemText primary={<Typography variant="h6">{item.title}</Typography>} />
                )}
                {isSelected ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={isSelected} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                    {item.children.map((c) => (
                        <NavItem key={c.id} item={c} level={2} />
                    ))}
                </List>
            </Collapse>
        </>
    );
};

export default NavCollapse;
