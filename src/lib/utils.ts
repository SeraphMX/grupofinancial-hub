export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-MX').format(value)
}

export const formatCurrencyCNN = (numero: number): string => {
  if (numero >= 1e6) {
    return (numero / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  if (numero >= 1e3) {
    return (numero / 1e3).toFixed(1).replace(/\.0$/, '') + 'k'
  }
  return numero.toString()
}
