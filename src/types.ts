
export interface LibratoClientConfig {
  email: string,
  token: string,
  prefix?: string,
  period?: number,
}

export interface IncrementOptions {
  amount?: number,
  sporadic?: true,
  source?: string
}

// old-style metrics
export interface Gauge {
  name: string,
  value: number,
  period: number,
  attributes?: MetricAttributes,
}

export interface MultiSampleGauge {
  name: string,
  count: number,
  sum: number,
  max: number,
  min: number,
  sum_squares: number,
  period: number,
  attributes?: MetricAttributes,
}

export interface Credentials {
  user: string,
  pass: string,
}

export interface MetricAttributes {
  aggregate?: boolean,
  summarize_function?: string,
}
