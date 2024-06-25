import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useEffect, useRef } from 'react';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { getReviewPhase, reviewIsActive, REVIEW_YEAR } from '../../lib/reviewUtils';
import { showReviewOnFrontPageIfActive } from '../../lib/publicSettings';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { LAST_VISITED_FRONTPAGE_COOKIE } from '../../lib/cookies/cookies';
import moment from 'moment';
import { visitorGetsDynamicFrontpage } from '../../lib/betas';
import { isServer } from '@/lib/executionEnvironment';

const LWHome = () => {
  const { DismissibleSpotlightItem, RecentDiscussionFeed, AnalyticsInViewTracker, FrontpageReviewWidget,
    SingleColumnSection, FrontpageBestOfLWWidget, EAPopularCommentsSection,
    QuickTakesSection, LWHomePosts
  } = Components;

  const [cookies] = useCookiesWithConsent([LAST_VISITED_FRONTPAGE_COOKIE]);
  const isReturningVisitor = isServer ? !!cookies[LAST_VISITED_FRONTPAGE_COOKIE] : !!window.isReturningVisitor;

  return (
      <AnalyticsContext pageContext="homePage">
        <React.Fragment>
          <UpdateLastVisitCookie />

          {reviewIsActive() && getReviewPhase() === "RESULTS" && <SingleColumnSection>
            <FrontpageBestOfLWWidget reviewYear={REVIEW_YEAR}/>
          </SingleColumnSection>}
          {reviewIsActive() && getReviewPhase() !== "RESULTS" && showReviewOnFrontPageIfActive.get() && <SingleColumnSection>
            <FrontpageReviewWidget reviewYear={REVIEW_YEAR}/>
          </SingleColumnSection>}
          <SingleColumnSection>
            <DismissibleSpotlightItem current/>
          </SingleColumnSection>
          <AnalyticsInViewTracker
            eventProps={{inViewType: "homePosts"}}
            observerProps={{threshold:[0, 0.5, 1]}}
          >
            <LWHomePosts isReturningVisitor={isReturningVisitor}>
              <QuickTakesSection />
    
              <EAPopularCommentsSection />
    
              <RecentDiscussionFeed
                af={false}
                commentsLimit={4}
                maxAgeHours={18}
              />
            </LWHomePosts>
          </AnalyticsInViewTracker>
        </React.Fragment>
      </AnalyticsContext>
  )
}

const UpdateLastVisitCookie = () => {
  const [_, setCookie] = useCookiesWithConsent([LAST_VISITED_FRONTPAGE_COOKIE]);

  useEffect(() => {
    if (visitorGetsDynamicFrontpage(null)) {
      setCookie(LAST_VISITED_FRONTPAGE_COOKIE, new Date().toISOString(), { path: "/", expires: moment().add(1, 'year').toDate() });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setCookie])
  
  return <></>
}

const LWHomeComponent = registerComponent('LWHome', LWHome);

declare global {
  interface ComponentTypes {
    LWHome: typeof LWHomeComponent
  }
}
