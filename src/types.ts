interface LibratoClientConfig {
  email: string,
  token: string,
  prefix?: string,
  period?: number,
}

interface IncrementOptions {
  amount?: number,
  sporadic?: true,
  source?: string
}

// old-style metrics
interface Gauge {
  name: string,
  value: number,
  period: number,
  attributes?: MetricAttributes,
}

interface MultiSampleGauge {
  name: string,
  count: number,
  sum: number,
  max: number,
  min: number,
  sum_squares: number,
  period: number,
  attributes?: MetricAttributes,
}

interface Credentials {
  user: string,
  pass: string,
}

interface MetricAttributes {
  aggregate?: boolean,
  summarize_function?: string,
}
