/**
 * EventList Component
 * 
 * Displays a list or grid of events with filtering options
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { EventCard } from './EventCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, Grid3X3, List, Calendar } from 'lucide-react';
import { EventWithCounts, EventType, EventVisibility } from '@/lib/events/types';
import { getEventTypeLabel } from '@/lib/events/validation';
import { useDebounce } from '@/hooks/use-debounce';

interface EventListProps {
  initialEvents?: EventWithCounts[];
  showFilters?: boolean;
  gridView?: boolean;
  itemsPerPage?: number;
}

export function EventList({ 
  initialEvents = [], 
  showFilters = true,
  gridView: initialGridView = true,
  itemsPerPage = 12 
}: EventListProps) {
  const searchParams = useSearchParams();
  
  // State
  const [events, setEvents] = useState<EventWithCounts[]>(initialEvents);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  
  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [eventType, setEventType] = useState<EventType | 'all'>(
    (searchParams.get('type') as EventType) || 'all'
  );
  const [timeFilter, setTimeFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [gridView, setGridView] = useState(initialGridView);
  
  const debouncedSearch = useDebounce(search, 300);
  
  // Fetch events
  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (eventType !== 'all') params.append('type', eventType);
      
      // Time filter
      const now = new Date().toISOString();
      if (timeFilter === 'upcoming') {
        params.append('start_date', now);
      } else if (timeFilter === 'past') {
        params.append('end_date', now);
      }
      
      params.append('limit', itemsPerPage.toString());
      params.append('offset', ((page - 1) * itemsPerPage).toString());
      
      const response = await fetch(`/api/events?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      setEvents(data.events);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch events when filters change
  useEffect(() => {
    fetchEvents();
  }, [debouncedSearch, eventType, timeFilter, page]);
  
  // Handle RSVP
  const handleRSVP = async (eventId: string) => {
    // Navigate to event details for RSVP
    window.location.href = `/events/${eventId}#rsvp`;
  };
  
  const totalPages = Math.ceil(total / itemsPerPage);
  
  return (
    <div className="space-y-6">
      {showFilters && (
        <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 pb-4">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filters Row */}
            <div className="flex flex-wrap gap-4">
              <Select value={eventType} onValueChange={(value) => setEventType(value as EventType | 'all')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="meeting">{getEventTypeLabel('meeting')}</SelectItem>
                  <SelectItem value="fundraiser">{getEventTypeLabel('fundraiser')}</SelectItem>
                  <SelectItem value="volunteer">{getEventTypeLabel('volunteer')}</SelectItem>
                  <SelectItem value="social">{getEventTypeLabel('social')}</SelectItem>
                  <SelectItem value="educational">{getEventTypeLabel('educational')}</SelectItem>
                </SelectContent>
              </Select>
              
              <Tabs value={timeFilter} onValueChange={(value) => setTimeFilter(value as any)}>
                <TabsList>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="past">Past</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="ml-auto flex gap-2">
                <Button
                  variant={gridView ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setGridView(true)}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={!gridView ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setGridView(false)}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Events Display */}
      {loading ? (
        <div className={gridView ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[250px]" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Error: {error}</p>
          <Button onClick={fetchEvents}>Try Again</Button>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">No events found</p>
          <p className="text-muted-foreground">
            {search || eventType !== 'all' ? 'Try adjusting your filters' : 'Check back later for upcoming events'}
          </p>
        </div>
      ) : (
        <>
          <div className={gridView ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {events.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                onRSVP={handleRSVP}
                compact={!gridView}
              />
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-2">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                {totalPages > 5 && <span>...</span>}
                {totalPages > 5 && (
                  <Button
                    variant={page === totalPages ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setPage(totalPages)}
                  >
                    {totalPages}
                  </Button>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}