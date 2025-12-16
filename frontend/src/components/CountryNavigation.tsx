import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Globe } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { COUNTRIES, getCountryName, getCountryFlag } from '../lib/mock-data';

export const CountryNavigation: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // Get African countries (first 12 countries in the list)
  const africanCountries = COUNTRIES.slice(0, 12);
  const otherCountries = COUNTRIES.slice(12);

  const handleCountrySelect = (countryCode: string) => {
    setSelectedCountry(countryCode);
    navigate(`/country/${countryCode}`);
  };

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* African Countries - Primary Focus */}
          <div className="flex items-center space-x-1">
            <Globe className="h-4 w-4 text-gray-600 mr-2" />
            <span className="text-sm font-medium text-gray-700 mr-3">African Countries:</span>
            <div className="hidden lg:flex items-center space-x-1 overflow-x-auto">
              {africanCountries.map((country) => (
                <Button
                  key={country.code}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCountrySelect(country.code)}
                  className={`flex items-center space-x-1 px-2 py-1 text-xs whitespace-nowrap hover:bg-blue-100 transition-colors ${
                    selectedCountry === country.code ? 'bg-blue-100 text-blue-800' : ''
                  }`}
                >
                  <span>{country.flag}</span>
                  <span>{country.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Country Dropdown for Mobile and Additional Countries */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span>All Countries</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 max-h-96 overflow-y-auto">
              <DropdownMenuLabel>African Countries</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {africanCountries.map((country) => (
                <DropdownMenuItem
                  key={country.code}
                  onClick={() => handleCountrySelect(country.code)}
                  className="flex items-center space-x-3 cursor-pointer"
                >
                  <span className="text-lg">{country.flag}</span>
                  <div className="flex-1">
                    <div className="font-medium">{country.name}</div>
                    <div className="text-xs text-gray-500">{country.code}</div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    12 sources
                  </Badge>
                </DropdownMenuItem>
              ))}
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Other Countries</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {otherCountries.map((country) => (
                <DropdownMenuItem
                  key={country.code}
                  onClick={() => handleCountrySelect(country.code)}
                  className="flex items-center space-x-3 cursor-pointer"
                >
                  <span className="text-lg">{country.flag}</span>
                  <div className="flex-1">
                    <div className="font-medium">{country.name}</div>
                    <div className="text-xs text-gray-500">{country.code}</div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    5 sources
                  </Badge>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Scrollable African Countries */}
        <div className="lg:hidden flex items-center space-x-1 overflow-x-auto pb-2">
          {africanCountries.map((country) => (
            <Button
              key={country.code}
              variant="ghost"
              size="sm"
              onClick={() => handleCountrySelect(country.code)}
              className={`flex items-center space-x-1 px-3 py-1 text-xs whitespace-nowrap hover:bg-blue-100 transition-colors ${
                selectedCountry === country.code ? 'bg-blue-100 text-blue-800' : ''
              }`}
            >
              <span>{country.flag}</span>
              <span>{country.name}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
