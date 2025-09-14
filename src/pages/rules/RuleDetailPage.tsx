import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ruleService, Rule } from '@/services/api';
import { Container } from '@/components/container';
import { Loader2, ArrowLeft, FileText, Hash, User } from 'lucide-react';
import { Toolbar, ToolbarHeading, ToolbarActions } from '@/partials/toolbar';
import RuleGroup from './RuleGroup';
import { RuleTypeOptions } from './enums';
import { getRulePreview } from '@/services/rulePreviewService';

function getLabel(options: { label: string; value: any }[], value: any) {
  const found = options.find((opt) => opt.value === value);
  return found ? found.label : value;
}

const RuleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rule, setRule] = useState<Rule | null>(null);
  const [loading, setLoading] = useState(true);
  const [rulePreview, setRulePreview] = useState<string>('');

  useEffect(() => {
    const fetchRule = async () => {
      setLoading(true);
      try {
        if (!id) throw new Error('Invalid rule ID');
        const found = await ruleService.getRuleById(Number(id));
        setRule(found || null);
      } catch (error) {
        setRule(null);
      } finally {
        setLoading(false);
      }
    };
    fetchRule();
  }, [id]);

  useEffect(() => {
    const loadRulePreview = async () => {
      if (rule?.root) {
        try {
          const preview = await getRulePreview(rule.root);
          setRulePreview(preview);
        } catch (error) {
          console.error('Failed to generate rule preview:', error);
          setRulePreview(
            '[Metric] [Operator] [Value] in last [Duration] [Duration Type] for [Account Type]'
          );
        }
      } else {
        setRulePreview(
          '[Metric] [Operator] [Value] in last [Duration] [Duration Type] for [Account Type]'
        );
      }
    };
    loadRulePreview();
  }, [rule]);

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin w-8 h-8 text-primary" />
        </div>
      </Container>
    );
  }

  if (!rule) {
    return (
      <Container>
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold mb-2">Rule Not Found</h2>
          <p className="text-muted-foreground mb-4">The rule you are looking for does not exist.</p>
          <Button onClick={() => navigate('/rules')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Rules
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        <Toolbar>
          <div className="flex flex-col gap-1">
            <ToolbarHeading>Rule Details</ToolbarHeading>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-md">
                <Hash className="w-4 h-4 text-primary" />
                <span>ID: {rule.id}</span>
              </div>
              <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-md">
                <FileText className="w-4 h-4 text-primary" />
                <span>Name: {rule.name}</span>
              </div>
            </div>
          </div>
          <ToolbarActions>
            <Button
              variant="outline"
              onClick={() => navigate('/rules')}
              className="hover:bg-primary/5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Rules
            </Button>
          </ToolbarActions>
        </Toolbar>
        <Card>
          <CardHeader className="bg-primary/5 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Rule Information
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Basic information about the rule.</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <Hash className="w-4 h-4" />
                  ID
                </div>
                <div className="text-base font-medium">{rule.id}</div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" />
                  Name
                </div>
                <div className="text-base font-medium">{rule.name}</div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" />
                  Rule Type
                </div>
                <div className="text-base font-medium">
                  {getLabel(RuleTypeOptions, rule.ruleType)}
                </div>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" />
                  Active
                </div>
                <div className="text-base font-medium">{rule.isActive ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Rule Preview */}
        <div>
          <label className="block font-medium mb-2">Rule Preview</label>
          <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm font-mono text-gray-800">
            {rulePreview}
          </div>
        </div>
        <Card className="shadow-sm border-primary/10">
          <CardHeader className="bg-primary/5 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Rule Logic
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Visual representation of the rule logic.
            </p>
          </CardHeader>
          <CardContent className="p-6">
            {rule.root ? (
              <RuleGroup group={rule.root} isRoot readOnly />
            ) : (
              <div className="text-muted-foreground">No rule logic defined.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
  );
};

export default RuleDetailPage;
