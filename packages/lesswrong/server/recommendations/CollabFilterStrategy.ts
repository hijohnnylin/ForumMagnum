import FeatureStrategy from "./FeatureStrategy";
import type {
  StrategySpecification,
  WeightedFeature,
} from "../../lib/collections/users/recommendationSettings";

/**
 * This class implements a simple item-item collaborative filtering algorithm for
 * post recommendations. It works by storing the set of unique upvoters for each
 * post in a materialized view called `UniquePostUpvoters`. We then compute the
 * Jaccard index between the source post and each recommendable target post,
 * returning the posts with the highest indices.
 */
class CollabFilterStrategy extends FeatureStrategy {
  protected weightByTagSimilarity = false;

  async recommend(
    currentUser: DbUser|null,
    count: number,
    strategy: StrategySpecification,
  ): Promise<DbPost[]> {
    const features: WeightedFeature[] = [
      {feature: "collabFilter", weight: 1},
      {feature: "karma", weight: 0.2},
      {feature: "curated", weight: 0.05},
    ];
    if (this.weightByTagSimilarity) {
      features.push({feature: "tagSimilarity", weight: strategy.bias ?? 1.5});
    }
    return super.recommend(
      currentUser,
      count,
      {
        ...strategy,
        features,
      },
    );
  };
}

export default CollabFilterStrategy;
