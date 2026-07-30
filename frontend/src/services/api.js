const baseUrl = '/api';
export const PROJECT_BACKUP_MIME = 'application/vnd.qabase.project-backup+json';
export const PROJECT_BACKUP_LIMIT_BYTES = 50 * 1024 * 1024;

function handleUnauthorized(response, suppressUnauthorized = false) {
  if (response.status === 401 && !suppressUnauthorized) {
    window.dispatchEvent(new CustomEvent('qabase:unauthorized'));
  }
}

async function responseError(response, fallback = 'Erro inesperado') {
  const data = await response.json().catch(() => ({}));
  const error = new Error(data.error || fallback);
  error.status = response.status;
  error.code = data.code;
  return error;
}

async function request(path, options = {}) {
  const { suppressUnauthorized = false, ...fetchOptions } = options;
  const response = await fetch(`${baseUrl}${path}`, {
    ...fetchOptions,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers
    }
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    handleUnauthorized(response, suppressUnauthorized);
    const error = new Error(data.error || 'Erro inesperado');
    error.status = response.status;
    error.code = data.code;
    throw error;
  }

  return data;
}

async function backupMutation(path, content) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': PROJECT_BACKUP_MIME },
    body: content
  });

  if (!response.ok) {
    handleUnauthorized(response);
    throw await responseError(response, 'Nao foi possivel processar o backup.');
  }

  return response.json();
}

async function downloadProjectBackup(projectId) {
  const response = await fetch(`${baseUrl}/projects/${projectId}/backup`, {
    credentials: 'include'
  });

  if (!response.ok) {
    handleUnauthorized(response);
    throw await responseError(response, 'Nao foi possivel exportar o projeto.');
  }

  const disposition = response.headers.get('content-disposition') || '';
  const filename =
    disposition.match(/filename="([^"]+)"/i)?.[1] || `qabase-projeto-${projectId}.qabase`;

  return { blob: await response.blob(), filename };
}

export const api = {
  getCurrentSession: () =>
    request('/auth/session', { suppressUnauthorized: true }),
  login: (data) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
      suppressUnauthorized: true
    }),
  logout: () =>
    request('/auth/logout', {
      method: 'POST',
      suppressUnauthorized: true
    }),
  changePassword: (data) =>
    request('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  acknowledgePasswordNotice: () =>
    request('/auth/password-notice', {
      method: 'POST'
    }),
  listProjects: () => request('/projects'),
  createProject: (data) =>
    request('/projects', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateProject: (id, data) =>
    request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteProject: (id) =>
    request(`/projects/${id}`, {
      method: 'DELETE'
    }),
  downloadProjectBackup,
  previewProjectBackup: (content) =>
    backupMutation('/project-backups/preview', content),
  importProjectBackup: (content, name) =>
    backupMutation(`/project-backups/import?name=${encodeURIComponent(name)}`, content),
  getDashboard: (projectId) => request(`/projects/${projectId}/dashboard`),
  listSuites: (projectId) => request(`/projects/${projectId}/suites`),
  createSuite: (projectId, data) =>
    request(`/projects/${projectId}/suites`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateSuite: (id, data) =>
    request(`/suites/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteSuite: (id) =>
    request(`/suites/${id}`, {
      method: 'DELETE'
    }),
  listTestCases: (suiteId) => request(`/suites/${suiteId}/cases`),
  listProjectTestCases: (projectId, filters = {}) => {
    const searchParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'All') {
        searchParams.set(key, value);
      }
    });

    const query = searchParams.toString();
    return request(`/projects/${projectId}/cases${query ? `?${query}` : ''}`);
  },
  createTestCase: (suiteId, data) =>
    request(`/suites/${suiteId}/cases`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateTestCase: (id, data) =>
    request(`/cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteTestCase: (id) =>
    request(`/cases/${id}`, {
      method: 'DELETE'
    }),
  listTestComponents: (projectId) => request(`/projects/${projectId}/components`),
  createTestComponent: (projectId, data) =>
    request(`/projects/${projectId}/components`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateTestComponent: (id, data) =>
    request(`/components/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteTestComponent: (id) =>
    request(`/components/${id}`, {
      method: 'DELETE'
    }),
  listRuns: (projectId, filters = {}) => {
    const searchParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'All') {
        searchParams.set(key, value);
      }
    });

    const query = searchParams.toString();
    return request(`/projects/${projectId}/runs${query ? `?${query}` : ''}`);
  },
  createRun: (projectId, data) =>
    request(`/projects/${projectId}/runs`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getRun: (id) => request(`/runs/${id}`),
  completeRun: (id) =>
    request(`/runs/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'Completed' })
    }),
  updateRunCase: (id, data) =>
    request(`/run-cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  listTestPlans: (projectId) => request(`/projects/${projectId}/plans`),
  getTestPlan: (id) => request(`/plans/${id}`),
  createTestPlan: (projectId, data) =>
    request(`/projects/${projectId}/plans`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateTestPlan: (id, data) =>
    request(`/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteTestPlan: (id) =>
    request(`/plans/${id}`, {
      method: 'DELETE'
    }),
  listMilestones: (projectId) => request(`/projects/${projectId}/milestones`),
  createMilestone: (projectId, data) =>
    request(`/projects/${projectId}/milestones`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateMilestone: (id, data) =>
    request(`/milestones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteMilestone: (id) =>
    request(`/milestones/${id}`, {
      method: 'DELETE'
    }),
  listEnvironments: (projectId) => request(`/projects/${projectId}/environments`),
  createEnvironment: (projectId, data) =>
    request(`/projects/${projectId}/environments`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateEnvironment: (id, data) =>
    request(`/environments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteEnvironment: (id) =>
    request(`/environments/${id}`, {
      method: 'DELETE'
    }),
  listConfigurationGroups: (projectId) =>
    request(`/projects/${projectId}/configurations`),
  createConfigurationGroup: (projectId, data) =>
    request(`/projects/${projectId}/configuration-groups`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateConfigurationGroup: (id, data) =>
    request(`/configuration-groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteConfigurationGroup: (id) =>
    request(`/configuration-groups/${id}`, {
      method: 'DELETE'
    }),
  createConfigurationOption: (groupId, data) =>
    request(`/configuration-groups/${groupId}/options`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateConfigurationOption: (id, data) =>
    request(`/configuration-options/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteConfigurationOption: (id) =>
    request(`/configuration-options/${id}`, {
      method: 'DELETE'
    }),
  listValidationFolders: (projectId) =>
    request(`/projects/${projectId}/validation-folders`),
  createValidationFolder: (projectId, data) =>
    request(`/projects/${projectId}/validation-folders`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateValidationFolder: (id, data) =>
    request(`/validation-folders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteValidationFolder: (id) =>
    request(`/validation-folders/${id}`, {
      method: 'DELETE'
    }),
  listValidationBriefs: (projectId, filters = {}) => {
    const searchParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'All') {
        searchParams.set(key, value);
      }
    });

    const query = searchParams.toString();
    return request(
      `/projects/${projectId}/validation-briefs${query ? `?${query}` : ''}`
    );
  },
  getValidationBrief: (id) => request(`/validation-briefs/${id}`),
  createValidationBrief: (projectId, data) =>
    request(`/projects/${projectId}/validation-briefs`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateValidationBrief: (id, data) =>
    request(`/validation-briefs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteValidationBrief: (id) =>
    request(`/validation-briefs/${id}`, {
      method: 'DELETE'
    }),
  createValidationCriterion: (briefId, data) =>
    request(`/validation-briefs/${briefId}/criteria`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateValidationCriterion: (id, data) =>
    request(`/validation-criteria/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteValidationCriterion: (id) =>
    request(`/validation-criteria/${id}`, {
      method: 'DELETE'
    }),
  createValidationCheck: (briefId, data) =>
    request(`/validation-briefs/${briefId}/checks`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateValidationCheck: (id, data) =>
    request(`/validation-checks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteValidationCheck: (id) =>
    request(`/validation-checks/${id}`, {
      method: 'DELETE'
    }),
  promoteValidationCheck: (id, data) =>
    request(`/validation-checks/${id}/promote`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  createValidationNote: (briefId, data) =>
    request(`/validation-briefs/${briefId}/notes`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  deleteValidationNote: (id) =>
    request(`/validation-notes/${id}`, {
      method: 'DELETE'
    }),
  listProductionDemands: (projectId, filters = {}) => {
    const searchParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'All') {
        searchParams.set(key, value);
      }
    });

    const query = searchParams.toString();
    return request(
      `/projects/${projectId}/production-demands${query ? `?${query}` : ''}`
    );
  },
  getProductionDemandSummary: (projectId) =>
    request(`/projects/${projectId}/production-demands/summary`),
  getProductionDemand: (id) => request(`/production-demands/${id}`),
  createProductionDemand: (projectId, data) =>
    request(`/projects/${projectId}/production-demands`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateProductionDemand: (id, data) =>
    request(`/production-demands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteProductionDemand: (id) =>
    request(`/production-demands/${id}`, {
      method: 'DELETE'
    }),
  closeProductionDemand: (id, data) =>
    request(`/production-demands/${id}/close`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  reopenProductionDemand: (id, data) =>
    request(`/production-demands/${id}/reopen`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  createProductionDemandNote: (id, data) =>
    request(`/production-demands/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  deleteProductionDemandNote: (id) =>
    request(`/production-demand-activities/${id}`, {
      method: 'DELETE'
    }),
  listThirdParties: (filters = {}) => {
    const searchParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'All') {
        searchParams.set(key, value);
      }
    });

    const query = searchParams.toString();
    return request(`/third-parties${query ? `?${query}` : ''}`);
  },
  getThirdPartySummary: () => request('/third-parties/summary'),
  getThirdParty: (id) => request(`/third-parties/${id}`),
  createThirdParty: (data) =>
    request('/third-parties', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateThirdParty: (id, data) =>
    request(`/third-parties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  renewThirdPartyAccess: (id, data) =>
    request(`/third-parties/${id}/renew`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  closeThirdPartyAccess: (id, data) =>
    request(`/third-parties/${id}/close`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  deleteThirdParty: (id) =>
    request(`/third-parties/${id}`, {
      method: 'DELETE'
    }),
  createThirdPartyNote: (id, data) =>
    request(`/third-parties/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  deleteThirdPartyNote: (id) =>
    request(`/third-party-access-activities/${id}`, {
      method: 'DELETE'
    }),
  listQuickNotes: (filters = {}) => {
    const searchParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'All') {
        searchParams.set(key, value);
      }
    });

    const query = searchParams.toString();
    return request(`/quick-notes${query ? `?${query}` : ''}`);
  },
  listQuickNoteDays: () => request('/quick-notes/days'),
  getQuickNote: (id) => request(`/quick-notes/${id}`),
  createQuickNote: (data) =>
    request('/quick-notes', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateQuickNote: (id, data) =>
    request(`/quick-notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteQuickNote: (id) =>
    request(`/quick-notes/${id}`, {
      method: 'DELETE'
    }),
  getNotificationOverview: () => request('/notifications/overview'),
  getNotificationSettings: () => request('/notifications/settings'),
  updateNotificationSettings: (data) =>
    request('/notifications/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  getTelegramStatus: () => request('/notifications/telegram/status'),
  discoverTelegramGroups: () =>
    request('/notifications/telegram/discover', { method: 'POST' }),
  connectTelegramGroup: (chatId) =>
    request('/notifications/telegram/connect', {
      method: 'POST',
      body: JSON.stringify({ chatId })
    }),
  disconnectTelegramGroup: () =>
    request('/notifications/telegram/connection', { method: 'DELETE' }),
  testTelegramChannel: () =>
    request('/notifications/telegram/test', { method: 'POST' }),
  listNotificationDeliveries: (filters = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'All') searchParams.set(key, value);
    });
    const query = searchParams.toString();
    return request(`/notifications/deliveries${query ? `?${query}` : ''}`);
  },
  getNotificationDelivery: (id) => request(`/notifications/deliveries/${id}`),
  resendNotificationDelivery: (id) =>
    request(`/notifications/deliveries/${id}/resend`, { method: 'POST' })
};
