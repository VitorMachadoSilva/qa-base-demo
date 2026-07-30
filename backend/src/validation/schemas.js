import { z } from 'zod';
import {
  isValidSendTime,
  isValidTimeZone
} from '../services/notificationTime.js';
import { passwordPolicy } from '../auth/passwords.js';

const passwordValue = z
  .string()
  .min(
    passwordPolicy.minLength,
    `A senha deve ter pelo menos ${passwordPolicy.minLength} caracteres`
  )
  .max(
    passwordPolicy.maxLength,
    `A senha deve ter no maximo ${passwordPolicy.maxLength} caracteres`
  );

export const loginSchema = z.object({
  email: z.string().trim().email('Informe um login valido').max(200),
  password: z.string().min(1, 'Senha e obrigatoria').max(passwordPolicy.maxLength)
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Senha atual e obrigatoria')
      .max(passwordPolicy.maxLength),
    newPassword: passwordValue,
    confirmPassword: z.string().max(passwordPolicy.maxLength)
  })
  .superRefine((data, context) => {
    if (data.newPassword !== data.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A confirmacao nao corresponde a nova senha',
        path: ['confirmPassword']
      });
    }

    if (data.newPassword === data.currentPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A nova senha deve ser diferente da senha atual',
        path: ['newPassword']
      });
    }
  });

export const projectSchema = z.object({
  name: z.string().trim().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().trim().optional().nullable()
});

export const suiteSchema = z.object({
  name: z.string().trim().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().trim().optional().nullable(),
  parentId: z.number().int().positive().optional().nullable()
});

const uniqueIds = (message) => (ids) =>
  !ids || new Set(ids).size === ids.length || message;

const testStepSchema = z.object({
  action: z.string().trim().min(1, 'Acao do passo e obrigatoria'),
  expectedResult: z.string().trim().min(1, 'Resultado esperado do passo e obrigatorio')
});

export const testCaseSchema = z
  .object({
    title: z.string().trim().min(5, 'Titulo deve ter pelo menos 5 caracteres'),
    preconditions: z.string().trim().optional().nullable(),
    steps: z.string().trim().optional(),
    expectedResult: z.string().trim().optional(),
    testSteps: z.array(testStepSchema).min(1, 'Adicione pelo menos um passo').optional(),
    suiteId: z.number().int().positive().optional(),
    priority: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
    type: z
      .enum([
        'Functional',
        'Regression',
        'Smoke',
        'Exploratory',
        'Integration',
        'EndToEnd',
        'Performance',
        'Security',
        'Usability',
        'Accessibility'
      ])
      .default('Functional'),
    severity: z.enum(['Low', 'Normal', 'High', 'Critical']).default('Normal'),
    automationStatus: z.enum(['Manual', 'ToAutomate', 'Automated']).default('Manual'),
    componentIds: z
      .array(z.number().int().positive())
      .default([])
      .refine(uniqueIds('Nao repita componentes no mesmo caso'))
  })
  .superRefine((data, context) => {
    if (!data.testSteps?.length && !data.steps) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Adicione pelo menos um passo',
        path: ['testSteps']
      });
    }

    if (!data.testSteps?.length && !data.expectedResult) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Resultado esperado e obrigatorio',
        path: ['expectedResult']
      });
    }
  });

const planItemSchema = z.object({
  key: z.string().trim().min(1, 'Chave do item e obrigatoria').max(100),
  testCaseId: z.number().int().positive(),
  transitionInstructions: z.string().trim().max(4000).optional().nullable(),
  dependsOnItemKey: z.string().trim().max(100).optional().nullable()
});

const planSectionSchema = z.object({
  key: z.string().trim().min(1, 'Chave da secao e obrigatoria').max(100),
  name: z.string().trim().min(1, 'Nome da secao e obrigatorio').max(120),
  description: z.string().trim().max(2000).optional().nullable(),
  items: z.array(planItemSchema).default([])
});

export const testPlanSchema = z
  .object({
    name: z.string().trim().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    description: z.string().trim().optional().nullable(),
    testCaseIds: z.array(z.number().int().positive()).optional(),
    sections: z.array(planSectionSchema).min(1, 'Adicione pelo menos uma secao').optional()
  })
  .superRefine((data, context) => {
    if (data.sections) {
      const sectionKeys = new Set();
      const itemKeys = new Set();
      const orderedItemKeys = new Set();

      data.sections.forEach((section, sectionIndex) => {
        if (sectionKeys.has(section.key)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Cada secao precisa de uma chave unica',
            path: ['sections', sectionIndex, 'key']
          });
        }
        sectionKeys.add(section.key);

        section.items.forEach((item, itemIndex) => {
          if (itemKeys.has(item.key)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Cada item precisa de uma chave unica',
              path: ['sections', sectionIndex, 'items', itemIndex, 'key']
            });
          }

          if (item.dependsOnItemKey && !orderedItemKeys.has(item.dependsOnItemKey)) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'A dependencia deve apontar para um item anterior',
              path: ['sections', sectionIndex, 'items', itemIndex, 'dependsOnItemKey']
            });
          }

          itemKeys.add(item.key);
          orderedItemKeys.add(item.key);
        });
      });
    }
  });

export const testComponentSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(80),
  description: z.string().trim().max(500).optional().nullable(),
  position: z.number().int().positive().optional()
});

const optionalDate = z.preprocess(
  (value) => (value === '' || value === undefined || value === null ? null : value),
  z.coerce.date().nullable()
);

export const milestoneSchema = z
  .object({
    name: z.string().trim().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    description: z.string().trim().optional().nullable(),
    status: z.enum(['Upcoming', 'Active', 'Completed']).default('Upcoming'),
    startDate: optionalDate,
    dueDate: optionalDate
  })
  .superRefine((data, context) => {
    if (data.startDate && data.dueDate && data.dueDate < data.startDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Data final nao pode ser anterior a data inicial',
        path: ['dueDate']
      });
    }
  });

export const environmentSchema = z.object({
  name: z.string().trim().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().trim().optional().nullable(),
  target: z.string().trim().optional().nullable()
});

export const configurationGroupSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  position: z.number().int().positive().optional()
});

export const configurationOptionSchema = z.object({
  name: z.string().trim().min(1, 'Nome da opcao e obrigatorio')
});

export const runSchema = z
  .object({
    name: z.string().trim().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    testCaseIds: z
      .array(z.number().int().positive())
      .optional()
      .refine(uniqueIds('Nao repita casos no mesmo run')),
    testPlanId: z.number().int().positive().optional().nullable(),
    milestoneId: z.number().int().positive().optional().nullable(),
    environmentId: z.number().int().positive().optional().nullable(),
    configurationOptionIds: z
      .array(z.number().int().positive())
      .default([])
      .refine(uniqueIds('Nao repita configuracoes no mesmo run'))
  })
  .superRefine((data, context) => {
    const hasAdHocCases = Boolean(data.testCaseIds?.length);
    const hasPlan = Boolean(data.testPlanId);

    if (hasAdHocCases === hasPlan) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: hasPlan
          ? 'Escolha um plano ou uma selecao avulsa, nao ambos'
          : 'Selecione pelo menos um caso ou plano',
        path: ['testCaseIds']
      });
    }
  });

export const runCaseSchema = z.object({
  status: z.enum(['Untested', 'Passed', 'Failed', 'Blocked', 'Skipped']),
  comment: z.string().trim().optional().nullable(),
  actualResult: z.string().trim().optional().nullable(),
  evidence: z.string().trim().optional().nullable(),
  defectLink: z.string().trim().optional().nullable(),
  executor: z.string().trim().optional().nullable(),
  durationSeconds: z.number().int().min(0, 'Duracao nao pode ser negativa').optional().nullable()
});

export const completeRunSchema = z.object({
  status: z.literal('Completed')
});

const nullableText = z.preprocess(
  (value) => (value === '' || value === undefined || value === null ? null : value),
  z.string().trim().nullable()
);

const nullableHttpUrl = z.preprocess(
  (value) => (value === '' || value === undefined || value === null ? null : value),
  z
    .string()
    .trim()
    .url('Informe um link valido')
    .refine((value) => /^https?:\/\//i.test(value), 'Use um link HTTP ou HTTPS')
    .nullable()
);

export const validationFolderSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  parentId: z.number().int().positive().optional().nullable()
});

const validationBriefFields = {
  title: z.string().trim().min(3, 'Titulo deve ter pelo menos 3 caracteres'),
  folderId: z.number().int().positive().optional().nullable(),
  sourceUrl: nullableHttpUrl,
  objective: nullableText,
  scope: nullableText,
  generalNotes: nullableText,
  status: z.enum(['Draft', 'InProgress', 'Blocked', 'Completed']).default('Draft')
};

export const validationBriefCreateSchema = z.object({
  ...validationBriefFields,
  criteria: z
    .array(z.object({ text: z.string().trim().min(1, 'Criterio e obrigatorio') }))
    .default([]),
  checks: z
    .array(
      z.object({
        title: z.string().trim().min(1, 'Teste e obrigatorio'),
        expectedResult: z.string().trim().min(1, 'Resultado esperado e obrigatorio')
      })
    )
    .default([])
});

export const validationBriefUpdateSchema = z.object(validationBriefFields);

export const validationCriterionCreateSchema = z.object({
  text: z.string().trim().min(1, 'Criterio e obrigatorio'),
  isMet: z.boolean().default(false),
  position: z.number().int().positive().optional()
});

export const validationCriterionUpdateSchema = z.object({
  text: z.string().trim().min(1, 'Criterio e obrigatorio'),
  isMet: z.boolean(),
  position: z.number().int().positive().optional()
});

export const validationCheckCreateSchema = z.object({
  title: z.string().trim().min(1, 'Teste e obrigatorio'),
  expectedResult: z.string().trim().min(1, 'Resultado esperado e obrigatorio'),
  actualResult: nullableText,
  notes: nullableText,
  status: z.enum(['Untested', 'Passed', 'Failed', 'Blocked', 'Skipped']).default('Untested'),
  position: z.number().int().positive().optional()
});

export const validationCheckUpdateSchema = z.object({
  title: z.string().trim().min(1, 'Teste e obrigatorio'),
  expectedResult: z.string().trim().min(1, 'Resultado esperado e obrigatorio'),
  actualResult: nullableText,
  notes: nullableText,
  status: z.enum(['Untested', 'Passed', 'Failed', 'Blocked', 'Skipped']),
  position: z.number().int().positive().optional()
});

export const validationNoteSchema = z.object({
  kind: z.enum(['Note', 'Question', 'Risk', 'Evidence']).default('Note'),
  content: z.string().trim().min(1, 'Anotacao e obrigatoria')
});

export const validationPromotionSchema = z.object({
  suiteId: z.number().int().positive(),
  title: z.string().trim().min(5, 'Titulo deve ter pelo menos 5 caracteres'),
  expectedResult: z.string().trim().min(1, 'Resultado esperado e obrigatorio')
});

const nullablePositiveInteger = z.preprocess(
  (value) => (value === '' || value === undefined || value === null ? null : value),
  z.coerce.number().int().positive().nullable()
);

const productionDemandFields = {
  type: z.enum(['AD', 'MF']),
  code: z.string().trim().min(2, 'Codigo deve ter pelo menos 2 caracteres').max(50),
  sourceUrl: nullableHttpUrl,
  title: z.string().trim().min(3, 'Titulo deve ter pelo menos 3 caracteres').max(200),
  description: nullableText,
  supportContact: z.string().trim().min(2, 'Contato do suporte e obrigatorio').max(120),
  qaOwner: z.string().trim().min(2, 'Responsavel de QA e obrigatorio').max(120),
  registeredAt: z.coerce.date(),
  dueDate: optionalDate,
  criticality: z.enum(['Low', 'Medium', 'High']).optional().nullable(),
  affectedUsersCount: nullablePositiveInteger,
  validationBriefId: z.number().int().positive().optional().nullable(),
  runId: z.number().int().positive().optional().nullable(),
  milestoneId: z.number().int().positive().optional().nullable(),
  linkedAdId: z.number().int().positive().optional().nullable()
};

function addProductionDemandRules(schema) {
  return schema.superRefine((data, context) => {
    if (data.type === 'AD') {
      if (!data.criticality) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Criticidade e obrigatoria para AD',
          path: ['criticality']
        });
      }

      if (!data.affectedUsersCount) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Quantidade afetada e obrigatoria para AD',
          path: ['affectedUsersCount']
        });
      }

      if (data.linkedAdId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Somente MF pode ser vinculada a uma AD',
          path: ['linkedAdId']
        });
      }
    }

    if (data.type === 'MF') {
      if (data.dueDate) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'O prazo do MF e calculado a partir do registro',
          path: ['dueDate']
        });
      }

      if (data.criticality || data.affectedUsersCount) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Criticidade e quantidade afetada pertencem apenas a AD',
          path: ['criticality']
        });
      }
    }
  });
}

export const productionDemandCreateSchema = addProductionDemandRules(
  z.object(productionDemandFields)
);

export const productionDemandUpdateSchema = addProductionDemandRules(
  z.object({
    ...productionDemandFields,
    status: z.enum(['Open', 'InProgress', 'Waiting'])
  })
);

export const productionDemandFilterSchema = z.object({
  q: z.string().trim().optional(),
  type: z.enum(['AD', 'MF']).optional(),
  status: z.enum(['Open', 'InProgress', 'Waiting', 'Closed']).optional(),
  criticality: z.enum(['Low', 'Medium', 'High']).optional(),
  qaOwner: z.string().trim().optional(),
  deadlineState: z.enum(['NoDate', 'OnTrack', 'DueToday', 'Overdue', 'Closed']).optional()
});

export const productionDemandNoteSchema = z.object({
  content: z.string().trim().min(1, 'Anotacao e obrigatoria').max(4000),
  author: nullableText
});

export const productionDemandMfClosureSchema = z.object({
  workaroundSummary: z
    .string()
    .trim()
    .min(3, 'Resumo da solucao paliativa e obrigatorio')
    .max(4000),
  workaroundDeliveredAt: z.coerce.date(),
  closureReason: z.string().trim().min(3, 'Motivo do encerramento e obrigatorio').max(1000)
});

export const productionDemandAdClosureSchema = z.object({
  resolutionSummary: z.string().trim().min(3, 'Resumo da correcao e obrigatorio').max(4000),
  productionVersion: nullableText,
  productionReleasedAt: z.coerce.date(),
  closureReason: z.string().trim().min(3, 'Motivo do encerramento e obrigatorio').max(1000)
});

export const productionDemandReopenSchema = z.object({
  reason: z.string().trim().min(3, 'Motivo da reabertura e obrigatorio').max(1000)
});

export const THIRD_PARTY_ACCESS_SYSTEMS = [
  'Teams',
  'GitLab',
  'VPN',
  'Jira',
  'Confluence'
];

const thirdPartyIdentityFields = {
  name: z.string().trim().min(2, 'Nome e obrigatorio').max(160),
  company: z.string().trim().min(2, 'Empresa e obrigatoria').max(160),
  role: z.string().trim().min(2, 'Funcao e obrigatoria').max(160),
  contact: nullableText,
  internalOwner: z.string().trim().min(2, 'Responsavel interno e obrigatorio').max(160),
  notes: nullableText
};

const thirdPartyCycleFields = {
  approvedAt: z.coerce.date(),
  expiresAt: optionalDate,
  systems: z
    .array(z.enum(THIRD_PARTY_ACCESS_SYSTEMS))
    .min(1, 'Selecione pelo menos um acesso')
    .refine((systems) => new Set(systems).size === systems.length, 'Nao repita acessos')
};

export const thirdPartyCreateSchema = z.object({
  ...thirdPartyIdentityFields,
  ...thirdPartyCycleFields
});

export const thirdPartyUpdateSchema = z.object(thirdPartyIdentityFields);

export const thirdPartyFilterSchema = z.object({
  q: z.string().trim().optional(),
  state: z.enum(['Active', 'Expiring', 'Expired', 'Closed']).optional(),
  system: z.enum(THIRD_PARTY_ACCESS_SYSTEMS).optional(),
  company: z.string().trim().optional(),
  internalOwner: z.string().trim().optional()
});

export const thirdPartyRenewSchema = z.object({
  ...thirdPartyCycleFields,
  author: nullableText
});

export const thirdPartyCloseSchema = z.object({
  reason: z.string().trim().min(3, 'Motivo do encerramento e obrigatorio').max(1000),
  author: nullableText
});

export const thirdPartyNoteSchema = z.object({
  content: z.string().trim().min(1, 'Anotacao e obrigatoria').max(4000),
  author: nullableText
});

export const QUICK_NOTE_COLORS = [
  'Paper',
  'Lemon',
  'Mint',
  'Sky',
  'Lilac',
  'Rose',
  'Coral'
];

const quickNoteFields = {
  title: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
    z.string().trim().max(120, 'O titulo deve ter no maximo 120 caracteres').nullable().optional()
  ),
  content: z
    .string()
    .trim()
    .min(1, 'Escreva algo antes de salvar')
    .max(10000, 'A anotacao deve ter no maximo 10000 caracteres'),
  color: z.enum(QUICK_NOTE_COLORS),
  pinned: z.boolean()
};

export const quickNoteCreateSchema = z.object({
  ...quickNoteFields,
  color: quickNoteFields.color.default('Paper'),
  pinned: quickNoteFields.pinned.default(false)
});

export const quickNoteUpdateSchema = z.object(quickNoteFields);

export const quickNoteFilterSchema = z.object({
  q: z.string().trim().max(200).optional(),
  day: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data invalida')
    .optional(),
  pinned: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional()
});

export const notificationSettingsSchema = z.object({
  enabled: z.boolean(),
  timeZone: z
    .string()
    .trim()
    .min(1, 'Fuso horario e obrigatorio')
    .refine(isValidTimeZone, 'Fuso horario IANA invalido'),
  sendTime: z
    .string()
    .trim()
    .refine(isValidSendTime, 'Horario deve usar o formato HH:mm'),
  demandCadenceDays: z
    .number()
    .int()
    .min(1, 'A frequencia deve ser de pelo menos um dia')
    .max(90, 'A frequencia deve ser de no maximo 90 dias'),
  accessLeadDays: z
    .array(z.number().int().min(1).max(365))
    .min(1, 'Informe pelo menos uma antecedencia')
    .max(12, 'Informe no maximo 12 antecedencias')
    .refine((days) => new Set(days).size === days.length, 'Nao repita antecedencias')
});

export const notificationGroupConfirmationSchema = z.object({
  chatId: z.string().trim().min(1, 'Grupo invalido').max(40)
});

export const notificationDeliveryFilterSchema = z.object({
  type: z.enum(['DemandReport', 'AccessReport', 'Test', 'Resend']).optional(),
  trigger: z.enum(['Scheduled', 'CatchUp', 'Manual', 'ManualResend']).optional(),
  status: z
    .enum(['Pending', 'Processing', 'Sent', 'Failed', 'NoData', 'Cancelled'])
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(10).max(100).default(25)
});

export function validate(schema, body) {
  const result = schema.safeParse(body);

  if (!result.success) {
    const error = new Error(result.error.issues[0]?.message || 'Dados invalidos');
    error.status = 400;
    throw error;
  }

  return result.data;
}
