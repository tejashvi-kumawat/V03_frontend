import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, CheckCircle, XCircle, AlertCircle, Clock, Tool, FileText, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RCAHypothesis {
  id: string;
  text: string;
  status: 'active' | 'validated' | 'refuted' | 'inconclusive';
  confidence: number;
  test_results: Array<{
    test_name: string;
    tool: string;
    success: boolean;
    output: string;
    error: string;
    duration_ms: number;
  }>;
}

interface RCAResult {
  id: string;
  root_cause: string;
  confidence: number;
  findings: string[];
  recommendations: string[];
  hypotheses_tested: RCAHypothesis[];
  test_results: Array<{
    hypothesis_id: string;
    hypothesis_text: string;
    hypothesis_status: string;
    test_name: string;
    tool: string;
    status: string;
    result: string;
    error: string;
    duration_ms: number;
  }>;
  tools_used: string[];
  duration_minutes: number;
  created_at: string;
  report: string;
}

interface RCAInvestigationCardProps {
  result: RCAResult;
  onReanalyze?: () => void;
  onViewDetails?: () => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'validated':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'refuted':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'inconclusive':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    default:
      return <Clock className="h-4 w-4 text-blue-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'validated':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'refuted':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'inconclusive':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-blue-100 text-blue-800 border-blue-200';
  }
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return 'text-green-600';
  if (confidence >= 0.6) return 'text-yellow-600';
  return 'text-red-600';
};

export const RCAInvestigationCard: React.FC<RCAInvestigationCardProps> = ({
  result,
  onReanalyze,
  onViewDetails
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const validatedCount = result.hypotheses_tested.filter(h => h.status === 'validated').length;
  const refutedCount = result.hypotheses_tested.filter(h => h.status === 'refuted').length;
  const totalCount = result.hypotheses_tested.length;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">Root Cause Analysis</CardTitle>
              <p className="text-sm text-gray-500">
                Completed {formatDistanceToNow(new Date(result.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{result.duration_minutes.toFixed(1)}m</span>
            </Badge>
            {onReanalyze && (
              <Button variant="outline" size="sm" onClick={onReanalyze}>
                Re-analyze
              </Button>
            )}
            {onViewDetails && (
              <Button variant="outline" size="sm" onClick={onViewDetails}>
                View Details
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Root Cause Summary */}
        <Collapsible open={expandedSections.has('summary')} onOpenChange={() => toggleSection('summary')}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-semibold">Root Cause Identified</span>
              </div>
              {expandedSections.has('summary') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Primary Root Cause</h4>
                <p className="text-gray-700">{result.root_cause || 'No definitive root cause identified'}</p>
                {result.confidence && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Confidence Level</span>
                      <span className={`font-semibold ${getConfidenceColor(result.confidence)}`}>
                        {(result.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={result.confidence * 100} className="h-2" />
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Key Findings */}
        {result.findings.length > 0 && (
          <Collapsible open={expandedSections.has('findings')} onOpenChange={() => toggleSection('findings')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold">Key Findings ({result.findings.length})</span>
                </div>
                {expandedSections.has('findings') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <div className="space-y-2">
                {result.findings.map((finding, index) => (
                  <div key={index} className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg">
                    <div className="mt-1">
                      {finding.includes('✅') && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {finding.includes('❌') && <XCircle className="h-4 w-4 text-red-500" />}
                      {finding.includes('⚠️') && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                      {!finding.includes('✅') && !finding.includes('❌') && !finding.includes('⚠️') && 
                        <div className="h-4 w-4 rounded-full bg-gray-300" />}
                    </div>
                    <p className="text-sm text-gray-700 flex-1">{finding}</p>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Hypothesis Analysis */}
        {result.hypotheses_tested.length > 0 && (
          <Collapsible open={expandedSections.has('hypotheses')} onOpenChange={() => toggleSection('hypotheses')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  <span className="font-semibold">Hypothesis Analysis ({totalCount} tested)</span>
                </div>
                {expandedSections.has('hypotheses') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{validatedCount}</div>
                    <div className="text-sm text-green-700">Validated</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{refutedCount}</div>
                    <div className="text-sm text-red-700">Refuted</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{totalCount - validatedCount - refutedCount}</div>
                    <div className="text-sm text-blue-700">Inconclusive</div>
                  </div>
                </div>

                {/* Individual Hypotheses */}
                <div className="space-y-3">
                  {result.hypotheses_tested.map((hypothesis) => (
                    <div key={hypothesis.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(hypothesis.status)}
                          <span className="font-medium text-gray-900">{hypothesis.text}</span>
                        </div>
                        <Badge className={getStatusColor(hypothesis.status)}>
                          {hypothesis.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Confidence: {(hypothesis.confidence * 100).toFixed(1)}%</span>
                        <span>{hypothesis.test_results.length} tests</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Recommendations */}
        {result.recommendations.length > 0 && (
          <Collapsible open={expandedSections.has('recommendations')} onOpenChange={() => toggleSection('recommendations')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-semibold">Recommendations ({result.recommendations.length})</span>
                </div>
                {expandedSections.has('recommendations') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <div className="space-y-3">
                {result.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-green-600">{index + 1}</span>
                    </div>
                    <p className="text-sm text-gray-700 flex-1">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Tools Used */}
        {result.tools_used.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Tool className="h-4 w-4" />
            <span>Analysis Tools:</span>
            <div className="flex space-x-1">
              {result.tools_used.map((tool, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tool}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 