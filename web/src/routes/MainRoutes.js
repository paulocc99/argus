import { lazy } from 'react';

import Loadable from 'components/Loadable';
import MainLayout from 'layout/MainLayout';
import PrivateRoute from './PrivateRoute';

const DashboardDefault = Loadable(lazy(() => import('pages/dashboard')));
const Profile = Loadable(lazy(() => import('pages/profile')));
const RuleList = Loadable(lazy(() => import('pages/rules')));
const Rule = Loadable(lazy(() => import('pages/rules/Rule')));
const AlertList = Loadable(lazy(() => import('pages/alerts')));
const ATTACK = Loadable(lazy(() => import('pages/attack')));
const Assets = Loadable(lazy(() => import('pages/assets')));
const Baseline = Loadable(lazy(() => import('pages/baseline')));
const IngestPipelines = Loadable(lazy(() => import('pages/pipelines')));
const SigmaRepositories = Loadable(lazy(() => import('pages/sigma-repos')));
const Datasources = Loadable(lazy(() => import('pages/datasources')));

const MainRoutes = {
    path: '/',
    element: <MainLayout />,
    children: [
        {
            path: '/',
            element: <DashboardDefault />
        },
        {
            path: '/profile',
            element: <Profile />
        },
        {
            path: 'rules/:id',
            element: <Rule />
        },
        {
            path: 'rules/new',
            element: <Rule />
        },
        {
            path: 'rules',
            element: <RuleList />
        },
        {
            path: 'alerts',
            element: <AlertList />
        },
        {
            path: 'assets',
            element: <Assets />
        },
        {
            path: 'attack',
            element: <ATTACK />
        },
        {
            path: 'baseline',
            element: <Baseline />
        },
        {
            path: 'management/pipelines',
            element: <IngestPipelines />
        },
        {
            path: 'management/sigma',
            element: <SigmaRepositories />
        },
        {
            path: 'management/datasources',
            element: <Datasources />
        }
    ]
};

MainRoutes.children.forEach((r) => (r.element = <PrivateRoute>{r.element}</PrivateRoute>));

export default MainRoutes;
