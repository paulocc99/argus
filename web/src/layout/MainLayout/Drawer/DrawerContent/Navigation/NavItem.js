import { forwardRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { useTheme } from '@mui/material/styles';
import { Avatar, Chip, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';

import { activeItem } from 'store/reducers/menu';

const NavItem = ({ item, level }) => {
    const location = useLocation();

    const theme = useTheme();
    const dispatch = useDispatch();
    const menu = useSelector((state) => state.menu);
    const { drawerOpen, openItem } = menu;

    let itemTarget = '_self';
    if (item.target) {
        itemTarget = '_blank';
    }

    let listItemProps = { component: forwardRef((props, ref) => <Link ref={ref} {...props} to={item.url} target={itemTarget} />) };
    if (item?.external) {
        listItemProps = { component: 'a', href: item.url, target: itemTarget };
    }

    const itemHandler = (id) => {
        dispatch(activeItem({ openItem: [id] }));
    };

    const Icon = item.icon;
    const itemIcon = item.icon ? <Icon style={{ fontSize: drawerOpen ? '1rem' : '1.25rem' }} /> : false;

    const isSelected = openItem.findIndex((id) => id === item.id) > -1;

    // active menu item on page load
    useEffect(() => {
        const currentIndex = document.location.pathname
            .toString()
            .split('/')
            .findIndex((id) => id === item.id);
        if (currentIndex > -1) {
            dispatch(activeItem({ openItem: [item.id] }));
        }
    }, [, location.pathname]);

    const textColor = 'text.primary';
    const iconSelectedColor = 'primary.main';

    return (
        <ListItemButton
            {...listItemProps}
            disabled={item.disabled}
            onClick={() => itemHandler(item.id)}
            selected={isSelected}
            sx={{
                zIndex: 1201,
                pl: drawerOpen ? `${level * 28}px` : 1.5,
                py: !drawerOpen && level === 1 ? 1.25 : 1,
                ...(drawerOpen && {
                    '&:hover': {
                        bgcolor: 'primary.lighter'
                    },
                    '&.Mui-selected': {
                        bgcolor: 'primary.lighter',
                        borderRight: `2px solid ${theme.palette.primary.main}`,
                        color: iconSelectedColor,
                        '&:hover': {
                            color: iconSelectedColor,
                            bgcolor: 'primary.lighter'
                        }
                    }
                }),
                ...(!drawerOpen && {
                    '&:hover': {
                        bgcolor: 'transparent'
                    },
                    '&.Mui-selected': {
                        '&:hover': {
                            bgcolor: 'transparent'
                        },
                        bgcolor: 'transparent'
                    }
                })
            }}
        >
            {itemIcon && (
                <ListItemIcon
                    sx={{
                        minWidth: 28,
                        color: isSelected ? iconSelectedColor : textColor,
                        ...(!drawerOpen && {
                            borderRadius: 1.5,
                            width: 36,
                            height: 36,
                            alignItems: 'center',
                            justifyContent: 'center',
                            '&:hover': {
                                bgcolor: 'secondary.lighter'
                            }
                        }),
                        ...(!drawerOpen &&
                            isSelected && {
                                bgcolor: 'primary.lighter',
                                '&:hover': {
                                    bgcolor: 'primary.lighter'
                                }
                            })
                    }}
                >
                    {itemIcon}
                </ListItemIcon>
            )}
            {(drawerOpen || (!drawerOpen && level !== 1)) && (
                <ListItemText
                    primary={
                        <Typography variant="h6" sx={{ color: isSelected ? iconSelectedColor : textColor }}>
                            {item.title}
                        </Typography>
                    }
                />
            )}
            {(drawerOpen || (!drawerOpen && level !== 1)) && item.chip && (
                <Chip
                    color={item.chip.color}
                    variant={item.chip.variant}
                    size={item.chip.size}
                    label={item.chip.label}
                    avatar={item.chip.avatar && <Avatar>{item.chip.avatar}</Avatar>}
                />
            )}
        </ListItemButton>
    );
};

export default NavItem;
