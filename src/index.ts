#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';

interface WeatherData {
  current_condition: Array<{
    temp_C: string;
    humidity: string;
    weatherDesc: Array<{ value: string }>;
    windspeedKmph: string;
    FeelsLikeC: string;
    uvIndex: string;
  }>;
}

interface WttrResponse {
  data: WeatherData;
}

async function fetchWeather(city: string): Promise<WeatherData> {
  const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch weather for ${city}: ${response.statusText}`);
  }
  
  const json = await response.json() as WttrResponse;
  return json.data;
}

function formatWeather(data: WeatherData, city: string): string {
  const current = data.current_condition[0];
  
  const location = city;
  
  const temp = current.temp_C;
  const feelsLike = current.FeelsLikeC;
  const humidity = current.humidity;
  const description = current.weatherDesc[0]?.value || 'Unknown';
  const windSpeed = current.windspeedKmph;
  const uvIndex = current.uvIndex;
  
  const output = [
    `${chalk.bold('🌤️  Weather Report')}`,
    `${chalk.blue('Location:')} ${location}`,
    `${chalk.yellow('Temperature:')} ${temp}°C (Feels like ${feelsLike}°C)`,
    `${chalk.green('Condition:')} ${description}`,
    `${chalk.cyan('Humidity:')} ${humidity}%`,
    `${chalk.magenta('Wind:')} ${windSpeed} km/h`,
    `${chalk.red('UV Index:')} ${uvIndex}`,
  ].join('\n');
  
  return output;
}

const program = new Command();

program
  .name('weather-cli')
  .description('CLI weather query tool')
  .version('1.0.0');

program
  .argument('[city]', 'City name to query weather for')
  .action(async (city: string) => {
    const targetCity = city || 'Beijing';
    
    try {
      console.log(chalk.blue(`Fetching weather for ${targetCity}...`));
      const weatherData = await fetchWeather(targetCity);
      const formatted = formatWeather(weatherData, targetCity);
      console.log('\n' + formatted);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          console.error(chalk.red('Error: Could not connect to weather service. Please check your internet connection.'));
        } else if (error.message.includes('404')) {
          console.error(chalk.red(`Error: City "${targetCity}" not found. Please check the spelling.`));
        } else {
          console.error(chalk.red(`Error: ${error.message}`));
        }
      } else {
        console.error(chalk.red('An unknown error occurred'));
      }
      process.exit(1);
    }
  });

program.parse();