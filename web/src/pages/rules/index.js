import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Fab, Grid, Typography, Stack, MenuItem } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PublishIcon from '@mui/icons-material/Publish';

import { deleteRule, getRules, postImportRule, updateRuleState } from 'api';
import { setError, setSuccess, n } from 'utils';
import ComponentSkeleton from 'common/ComponentSkeleton';
import { ruleTypeList, riskList, activeList } from 'common/List';
import { fabStyle } from 'themes/other';
import SearchBox from 'components/SearchBox';
import MainCard from 'components/cards/MainCard';
import FilterTextField from 'components/FilterTextField';
import ConfirmationDialog from 'components/ConfirmationDialog';
import RuleExternalDialog from './RuleExternalDialog';
import RuleTable from './RuleTable';

const RuleList = () => {
    const navigate = useNavigate();

    // Rules
    const [ruleList, setRuleList] = useState([]);
    const [ruleCount, setRuleCount] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('none');
    const [riskFilter, setRiskFilter] = useState('none');
    const [activeFilter, setActiveFilter] = useState('none');

    const [externalDialog, setExternalDialog] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [deleteData, setDeleteData] = useState();

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const handleRuleImport = async (rule_ids) => {
        await importExternalRule(rule_ids);
        fetchRules();
    };

    // API
    const fetchRules = async () => {
        try {
            const params = {
                page: page,
                search: n(searchTerm),
                risk: n(riskFilter),
                type: n(typeFilter),
                active: n(activeFilter)
            };
            const response = await getRules(params);
            const { rules, size, pages } = response.data;
            setRuleList(rules);
            setRuleCount(size);
            setPages(pages);
        } catch (error) {
            setError("Couldn't retrieve rules", error);
        }
    };

    const modifyRuleState = async (id, state) => {
        try {
            const data = { active: state };
            await updateRuleState(id, data);
            setSuccess('Rule state updated');
        } catch (error) {
            setError("Couldn't update rule state", error.message);
        }
    };

    const importExternalRule = async (ids) => {
        try {
            await postImportRule(ids);
            setSuccess('Rules imported with success');
        } catch (error) {
            setError('Error on rule import', error.message);
        }
    };

    const confirmRuleDelete = (rule) => {
        setDeleteDialog(true);
        setDeleteData({ title: rule.name, id: rule.uuid });
    };

    const removeRule = async () => {
        try {
            await deleteRule(deleteData.id);
            setSuccess('Rule deleted');
            setRuleList(ruleList.filter((e) => e.uuid != deleteData.id));
        } catch (error) {
            setError('Error on rule deletion', error.message);
        } finally {
            setDeleteDialog(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, [, searchTerm, typeFilter, riskFilter, activeFilter, page]);

    return (
        <ComponentSkeleton>
            <Grid container spacing={3}>
                <Grid item lg={12}>
                    <Grid container alignItems="center" justifyContent="space-between">
                        <Grid item>
                            <Typography variant="h5">{`Rules (${ruleCount})`}</Typography>
                            {/*<Typography variant="body2">{`6 rules available`}</Typography>*/}
                        </Grid>
                        <Stack direction="row" spacing={3} alignItems="right" sx={{ mr: 1 }}>
                            <SearchBox search={(e) => setSearchTerm(e)} placeholder="Rule name" />
                            <FilterTextField
                                id="type-filter"
                                size="small"
                                label="Type"
                                select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                            >
                                {ruleTypeList.map((option) => (
                                    <MenuItem key={`type-${option.value}`} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </FilterTextField>
                            <FilterTextField
                                id="risk-filter"
                                size="small"
                                label="Risk"
                                select
                                value={riskFilter}
                                onChange={(e) => setRiskFilter(e.target.value)}
                            >
                                {riskList.map((option) => (
                                    <MenuItem key={`risk-${option.value}`} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </FilterTextField>
                            <FilterTextField
                                id="active-filter"
                                size="small"
                                label="Active"
                                select
                                value={activeFilter}
                                onChange={(e) => setActiveFilter(e.target.value)}
                            >
                                {activeList.map((option) => (
                                    <MenuItem key={`active-${option.label}`} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </FilterTextField>
                        </Stack>
                    </Grid>
                    <MainCard sx={{ mt: 2 }} content={false}>
                        <RuleTable
                            rules={ruleList}
                            stateUpdate={modifyRuleState}
                            remove={confirmRuleDelete}
                            page={page}
                            pages={pages}
                            hChange={handlePageChange}
                        />
                    </MainCard>
                    <Grid container alignItems="right" justifyContent="right"></Grid>
                </Grid>
            </Grid>
            <Fab
                onClick={() => setExternalDialog(true)}
                color="indigo"
                aria-label="add"
                sx={{ ...fabStyle, right: (theme) => theme.spacing(12) }}
            >
                <PublishIcon />
            </Fab>
            <Fab color="primary" aria-label="add" onClick={() => navigate('/rules/new')} sx={fabStyle}>
                <AddIcon />
            </Fab>
            <RuleExternalDialog open={externalDialog} handleClose={() => setExternalDialog(false)} batchImport={handleRuleImport} />
            <ConfirmationDialog
                title={deleteData?.title}
                content="Are you sure you want to delete this rule?"
                btn="Delete"
                open={deleteDialog}
                onClose={() => setDeleteDialog(false)}
                onConfirm={removeRule}
            />
        </ComponentSkeleton>
    );
};

export default RuleList;
