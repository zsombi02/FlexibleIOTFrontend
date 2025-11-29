import { EChartsOption } from 'echarts';


export interface ChartStrategy {
  getOption(timestamps: string[], values: number[], color: string): EChartsOption;
}

/**
 * Concrete Strategy 1: Vonaldiagram
 */
export class LineChartStrategy implements ChartStrategy {
  getOption(timestamps: string[], values: number[], color: string): EChartsOption {
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 20, top: 30, bottom: 30 },
      xAxis: {
        type: 'category',
        data: timestamps,
        boundaryGap: false
      },
      yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
      series: [{
        data: values,
        type: 'line',
        smooth: true,
        showSymbol: false,
        itemStyle: { color: color },
        lineStyle: { width: 2 }
      }]
    };
  }
}

/**
 * Concrete Strategy 2: Területdiagram (Area)
 */
export class AreaChartStrategy implements ChartStrategy {
  getOption(timestamps: string[], values: number[], color: string): EChartsOption {
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 20, top: 30, bottom: 30 },
      xAxis: {
        type: 'category',
        data: timestamps,
        boundaryGap: false
      },
      yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
      series: [{
        data: values,
        type: 'line',
        smooth: true,
        showSymbol: false,
        areaStyle: { opacity: 0.3, color: color }, // Area specifikus
        itemStyle: { color: color },
        lineStyle: { width: 2 }
      }]
    };
  }
}

/**
 * Concrete Strategy 3: Oszlopdiagram (Bar)
 */
export class BarChartStrategy implements ChartStrategy {
  getOption(timestamps: string[], values: number[], color: string): EChartsOption {
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 20, top: 30, bottom: 30 },
      xAxis: {
        type: 'category',
        data: timestamps,
        boundaryGap: true // Bar chartnál kell a gap
      },
      yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
      series: [{
        data: values,
        type: 'bar',
        itemStyle: { color: color, borderRadius: [4, 4, 0, 0] }
      }]
    };
  }
}

/**
 * Factory (Gyártó minta - egyszerűsítve):
 * Segít kiválasztani a megfelelő stratégiát string alapján.
 */
export class ChartStrategyFactory {
  static getStrategy(type: string): ChartStrategy {
    switch (type) {
      case 'bar': return new BarChartStrategy();
      case 'area': return new AreaChartStrategy();
      case 'line':
      default: return new LineChartStrategy();
    }
  }
}
