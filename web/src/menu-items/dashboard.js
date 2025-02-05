import { DashboardOutlined, FundViewOutlined, BellOutlined, SecurityScanOutlined, SettingOutlined, ReadOutlined } from '@ant-design/icons';
import LanIcon from '@mui/icons-material/Lan';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import TransformIcon from '@mui/icons-material/Transform';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import StorageIcon from '@mui/icons-material/Storage';

const icons = {
    DashboardOutlined,
    FundViewOutlined,
    BellOutlined,
    SecurityScanOutlined,
    SettingOutlined,
    ReadOutlined,
    LanIcon,
    QueryStatsIcon,
    TransformIcon,
    TextSnippetIcon,
    StorageIcon
};

const dashboard = {
    id: 'group-dashboard',
    title: 'Navigation',
    type: 'group',
    children: [
        {
            id: 'dashboard',
            title: 'Dashboard',
            type: 'item',
            url: '/',
            icon: icons.FundViewOutlined,
            breadcrumbs: false
        },
        {
            id: 'rules',
            title: 'Rules',
            type: 'item',
            url: '/rules',
            icon: icons.SecurityScanOutlined,
            breadcrumbs: false
        },
        {
            id: 'alerts',
            title: 'Alerts',
            type: 'item',
            url: '/alerts',
            icon: icons.BellOutlined,
            breadcrumbs: false
        },
        {
            id: 'baseline',
            title: 'Baseline',
            type: 'item',
            url: '/baseline',
            icon: icons.QueryStatsIcon,
            breadcrumbs: false
        },
        {
            id: 'assets',
            title: 'Assets',
            type: 'item',
            url: '/assets',
            icon: icons.LanIcon,
            breadcrumbs: false
        },
        {
            id: 'attack',
            title: 'MITRE ATT&CK',
            type: 'item',
            url: '/attack',
            icon: icons.ReadOutlined,
            breadcrumbs: false
        },
        {
            id: 'management',
            title: 'Management',
            type: 'collapse',
            url: '/management',
            icon: icons.SettingOutlined,
            breadcrumbs: false,
            children: [
                {
                    id: 'datasources',
                    title: 'Datasources',
                    type: 'item',
                    url: '/management/datasources',
                    icon: icons.StorageIcon,
                    breadcrumbs: false
                },
                {
                    id: 'sigma',
                    title: 'Sigma Repositories',
                    type: 'item',
                    url: '/management/sigma',
                    icon: icons.TextSnippetIcon,
                    breadcrumbs: false
                },
                {
                    id: 'pipelines',
                    title: 'Pipelines',
                    type: 'item',
                    url: '/management/pipelines',
                    icon: icons.TransformIcon,
                    breadcrumbs: false
                }
            ]
        }
    ]
};

export default dashboard;
