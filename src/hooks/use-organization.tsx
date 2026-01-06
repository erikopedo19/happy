
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_by: string;
}

export interface Membership {
  id: string;
  org_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
}

export function useOrganization() {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrg() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // First try to find an organization owned by the user
        // Cast to any to avoid type errors if types aren't generated yet
        const { data: ownedOrgs } = await (supabase
          .from("organizations" as any)
          .select("*")
          .eq("created_by", user.id)
          .single() as any);

        if (ownedOrgs) {
          setOrganization(ownedOrgs);
          setMembership({
            id: 'owner', // virtual id
            org_id: ownedOrgs.id,
            user_id: user.id,
            role: 'owner'
          });
        } else {
          // If not owner, check memberships
          const { data: memberships } = await (supabase
            .from("memberships" as any)
            .select("*, organization:organizations(*)")
            .eq("user_id", user.id)
            .maybeSingle() as any);

          if (memberships && memberships.organization) {
            setOrganization(memberships.organization);
            setMembership({
              id: memberships.id,
              org_id: memberships.org_id,
              user_id: memberships.user_id,
              role: memberships.role
            });
          }
        }
      } catch (error) {
        console.error("Error loading organization:", error);
      } finally {
        setLoading(false);
      }
    }

    loadOrg();
  }, [user]);

  return {
    organization,
    membership,
    loading,
    isOwner: membership?.role === 'owner',
    isAdmin: membership?.role === 'owner' || membership?.role === 'admin'
  };
}
