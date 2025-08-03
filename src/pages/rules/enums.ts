// OperatorId
export enum OperatorId {
  And = 1,
  Or = 2,
}
export const OperatorIdOptions = [
  { label: 'AND', value: OperatorId.And },
  { label: 'OR', value: OperatorId.Or },
];

// AggregateFieldId
export enum AggregateFieldId {
  TransactionStatus = 1,
  Amount = 2,
  TransactionCount = 3,
  TransactionTime = 4,
  CurrencyAmount = 5,
}
export const AggregateFieldIdOptions = [
  { label: 'Transaction Status', value: AggregateFieldId.TransactionStatus },
  { label: 'Amount', value: AggregateFieldId.Amount },
  { label: 'Transaction Count', value: AggregateFieldId.TransactionCount },
  { label: 'Transaction Time', value: AggregateFieldId.TransactionTime },
  { label: 'Currency Amount', value: AggregateFieldId.CurrencyAmount },
];

// AggregateFunction
export enum AggregateFunction {
  Sum = 1,
  Average = 2,
  Count = 3,
  Min = 4,
  Max = 5,
}
export const AggregateFunctionOptions = [
  { label: 'Sum', value: AggregateFunction.Sum },
  { label: 'Average', value: AggregateFunction.Average },
  { label: 'Count', value: AggregateFunction.Count },
  { label: 'Min', value: AggregateFunction.Min },
  { label: 'Max', value: AggregateFunction.Max },
];

// AggregationBy
export enum AggregationBy {
  Sender = 1,
  Recipient = 2,
}
export const AggregationByOptions = [
  { label: 'Sender', value: AggregationBy.Sender },
  { label: 'Recipient', value: AggregationBy.Recipient },
];

// FilterBy
export enum FilterBy {
  Sender = 1,
  Recipient = 2,
}
export const FilterByOptions = [
  { label: 'Sender', value: FilterBy.Sender },
  { label: 'Recipient', value: FilterBy.Recipient },
];

// DurationType
export enum DurationType {
  Day = 1,
  Hour = 2,
  Month = 3,
  Year = 4,
}
export const DurationTypeOptions = [
  { label: 'Day', value: DurationType.Day },
  { label: 'Hour', value: DurationType.Hour },
  { label: 'Month', value: DurationType.Month },
  { label: 'Year', value: DurationType.Year },
];

// AccountType
export enum AccountType {
  CurrentAccount = 1,
  AllAccounts = 2,
}
export const AccountTypeOptions = [
  { label: 'Current Account', value: AccountType.CurrentAccount },
  { label: 'All Accounts', value: AccountType.AllAccounts },
];

// TransactionStatus
export enum TransactionStatus {
  Active = 1,
  Inactive = 2,
  Blocked = 3,
  Suspended = 4,
}
export const TransactionStatusOptions = [
  { label: 'Active', value: TransactionStatus.Active },
  { label: 'Inactive', value: TransactionStatus.Inactive },
  { label: 'Blocked', value: TransactionStatus.Blocked },
  { label: 'Suspended', value: TransactionStatus.Suspended },
];

// StatusOperator enum
export enum StatusOperator {
  In = 9,
  NotIn = 10,
}

// Operators for Transaction Status
export const StatusOperatorOptions = [
  { label: 'In', value: StatusOperator.In },
  { label: 'Not In', value: StatusOperator.NotIn },
];

// ComparisonOperator enum
export enum ComparisonOperator {
  Equal = 1,
  NotEqual = 2,
  GreaterThan = 3,
  GreaterThanOrEqual = 4,
  LessThan = 5,
  LessThanOrEqual = 6,
  Contains = 7,
  NotContains = 8,
  In = 9,
  NotIn = 10,
}

// Comparison operators for numeric/comparable fields
export const ComparisonOperatorOptions = [
  { label: 'Equal to =', value: ComparisonOperator.Equal },
  { label: 'Not equal to !=', value: ComparisonOperator.NotEqual },
  { label: 'Greater than >', value: ComparisonOperator.GreaterThan },
  { label: 'Less than <', value: ComparisonOperator.LessThan },
  { label: 'Greater than or equal to >=', value: ComparisonOperator.GreaterThanOrEqual },
  { label: 'Less than or equal to <=', value: ComparisonOperator.LessThanOrEqual },
  { label: 'Contains', value: ComparisonOperator.Contains },
  { label: 'Not Contains', value: ComparisonOperator.NotContains },
  { label: 'In', value: ComparisonOperator.In },
  { label: 'Not In', value: ComparisonOperator.NotIn },
];

// Rule Type options for RuleBuilderPage
export const RuleTypeOptions = [
  { label: 'Transaction Monitoring (TM)', value: 1 },
  { label: 'Transaction Screening (TS)', value: 2 },
  { label: 'Financial Fraud (FF)', value: 3 },
  { label: 'Anti-Concealment (AC)', value: 4 },
];

// ApplyTo enum
export enum ApplyTo {
  Sender = 1,
  Receiver = 2,
}
export const ApplyToOptions = [
  { label: 'Sender', value: ApplyTo.Sender },
  { label: 'Receiver', value: ApplyTo.Receiver },
]; 